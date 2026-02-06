// services/uploadService.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import apiService from './apiService';

export interface UploadedFile {
  key: string;
  publicUrl: string;
  fileName: string;
  fileType: string;
}

class UploadService {
  
  // ... (pickImage, pickMultipleImages, pickMultipleVideos, pickDocument SE QUEDAN IGUAL) ...
  // ... Puedes dejar esas funciones de selección tal cual están arriba ...

  // 👇👇👇 AQUÍ EMPIEZA LO NUEVO 👇👇👇

  /**
   * Sube un archivo a Cloudinary usando firma del backend
   * (Esta es la función MAESTRA que cambiamos)
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: string,
    folder = 'uploads',
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    try {
      console.log(`[UploadService] Getting presigned data for ${fileName} (${fileType})`);
      
      // 1. Pedir credenciales al Backend
      const response = await apiService.post('/uploads/presigned-upload', {
        fileName,
        contentType: fileType,
        folder,
      });

      // Backend devuelve: url, signature, apiKey, timestamp, publicId, publicUrl...
      const { url, publicUrl, key, signature, apiKey, timestamp, publicId } = response;

      if (!url) {
        throw new Error('No se recibió URL de subida del servidor');
      }

      console.log(`[UploadService] Uploading to Cloudinary...`);

      // 2. Subir a Cloudinary (POST Multipart)
      const uploadResponse = await FileSystem.uploadAsync(url, fileUri, {
        httpMethod: 'POST', // Cloudinary usa POST
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file', // OBLIGATORIO: Cloudinary pide que el archivo se llame 'file'
        headers: {
            // FileSystem pone el Content-Type multipart automáticamente
        },
        parameters: {
            // Los datos secretos que nos dio el backend
            api_key: apiKey,
            timestamp: String(timestamp),
            signature: signature,
            folder: folder,
            public_id: publicId
        }
      });

      if (uploadResponse.status !== 200) {
        console.error('❌ [UploadService] Cloudinary Upload Failed:', {
          status: uploadResponse.status,
          body: uploadResponse.body,
        });
        throw new Error(`Error al subir a Cloudinary (Status: ${uploadResponse.status})`);
      }

      console.log('✅ [UploadService] Upload successful:', publicUrl);

      return {
        key,         // public_id
        publicUrl,   // URL final
        fileName,
        fileType,
      };
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos en paralelo
   */
  async uploadMultipleFiles(
    files: { uri: string; name: string; type: string }[],
    folder = 'uploads',
    onProgress?: (index: number, progress: number) => void
  ): Promise<UploadedFile[]> {
    console.log(`[UploadService] Starting parallel upload of ${files.length} files`);
    
    const uploadPromises = files.map((file, index) => 
      this.uploadFile(
        file.uri, 
        file.name, 
        file.type, 
        folder, 
        (progress) => onProgress?.(index, progress)
      )
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('One or more uploads failed:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo (El backend se encarga de saber que es Cloudinary)
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await apiService.delete(`/uploads/${encodeURIComponent(key)}`);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }

  /**
   * Obtiene la URL de descarga
   */
  async getDownloadUrl(key: string): Promise<string> {
    try {
      const response = await apiService.post('/uploads/presigned-download', {
        key,
      });
      // ⚠️ CORRECCIÓN: Tu backend ahora devuelve { url: "..." }, no { downloadUrl: "..." }
      return response.url || response.downloadUrl; 
    } catch (error) {
      console.error('Error al obtener URL de descarga:', error);
      throw error;
    }
  }

  // Helper de MimeType (Se queda igual)
  getMimeType(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Sube una foto de perfil (avatar)
   * Solo cambié los logs, la lógica usa uploadFile así que está OK.
   */
  async uploadAvatar(
    imageUri: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const fileName = `avatar_${userId}_${Date.now()}.jpg`;
      const fileType = this.getMimeType(imageUri);
      
      const result = await this.uploadFile(
        imageUri,
        fileName,
        fileType,
        'users',
        onProgress
      );

      return result.publicUrl;
    } catch (error) {
      console.error('Error al subir avatar:', error);
      throw error;
    }
  }

  /**
   * Sube un informe PDF de inspección
   */
  async uploadInspectionReport(
    file: { uri: string; name: string; mimeType?: string },
    inspectionId: string,
    token: string, // <-- Este token ya no se usa aquí, pero lo dejo por compatibilidad
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const fileName = `inspection_${inspectionId}_${Date.now()}.pdf`;
      const fileType = file.mimeType || 'application/pdf';
      
      const result = await this.uploadFile(
        file.uri,
        fileName,
        fileType,
        'inspection-reports',
        onProgress
      );

      return result.publicUrl;
    } catch (error) {
      console.error('Error al subir informe PDF:', error);
      throw error;
    }
  }

  /**
   * Sube documentos o fotos adicionales de la inspección
   */
  async uploadInspectionMedia(
    file: { uri: string; name: string; mimeType?: string },
    inspectionId: string,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const extension = file.name?.split('.').pop() || 'jpg';
      const fileName = `inspection_${inspectionId}_doc_${Date.now()}.${extension}`;
      const fileType = file.mimeType || 'application/octet-stream';
      
      // 👇 Aquí está la magia: llama a uploadFile (que ya arreglamos), así que esto funciona.
      const result = await this.uploadFile(
        file.uri,
        fileName,
        fileType,
        'inspection-media',
        onProgress
      );

      return result.publicUrl;
    } catch (error) {
      console.error('Error al subir documento de inspección:', error);
      throw error;
    }
  }
}

export default new UploadService();