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
  /**
   * Selecciona una imagen de la galería o cámara
   */
  async pickImage(useCamera = false): Promise<ImagePicker.ImagePickerAsset | null> {
    const { status } = await (useCamera 
      ? ImagePicker.requestCameraPermissionsAsync()
      : ImagePicker.requestMediaLibraryPermissionsAsync()
    );

    if (status !== 'granted') {
      throw new Error('Permiso denegado para acceder a las imágenes');
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  /**
   * Selecciona múltiples imágenes
   */
  async pickMultipleImages(maxImages = 6): Promise<ImagePicker.ImagePickerAsset[]> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permiso denegado para acceder a las imágenes');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxImages,
    });

    if (!result.canceled) {
      return result.assets.slice(0, maxImages);
    }

    return [];
  }

  /**
   * Selecciona múltiples videos
   */
  async pickMultipleVideos(maxVideos = 6): Promise<ImagePicker.ImagePickerAsset[]> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permiso denegado para acceder a los videos');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.7,
      videoMaxDuration: 60,
      selectionLimit: maxVideos,
    });

    if (!result.canceled) {
      return result.assets.slice(0, maxVideos);
    }

    return [];
  }

  /**
   * Selecciona un documento
   */
  async pickDocument(): Promise<any | null> {
    // Nota: Esta función requiere expo-document-picker
    // Para usarla, instala: npx expo install expo-document-picker
    console.log('La selección de documentos aún no está implementada');
    return null;
  }

  /**
   * Sube un archivo a Cloudinary usando credenciales firmadas
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: string,
    folder = 'uploads',
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    try {
      // 1. Obtener credenciales firmadas del backend
      const response = await apiService.post('/uploads/presigned-upload', {
        fileName,
        contentType: fileType,
        folder,
      });

      // Obtener parámetros de Cloudinary
      const uploadUrl = response.uploadUrl || response.url;
      const signature = response.signature;
      const timestamp = response.timestamp;
      const api_key = response.api_key;
      const publicId = response.publicId;
      const publicUrl = response.publicUrl;

      if (!uploadUrl) {
        throw new Error('No se recibió URL de subida del servidor');
      }

      // 2. Si es una URL de localhost (mock), simulamos la subida
      if (uploadUrl.includes('localhost')) {
        console.log('⚠️ [UploadService] Detectada URL mock (localhost). Simulando subida exitosa.');
        return {
          key: publicId,
          publicUrl,
          fileName,
          fileType,
        };
      }

      // 3. Preparar formulario multipart para Cloudinary
      const formData = new FormData();
      
      // Agregar archivo
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any);

      // Agregar parámetros Cloudinary
      formData.append('public_id', publicId);
      formData.append('api_key', api_key);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('folder', folder);

      const uploadResponse = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters: {
          public_id: publicId,
          api_key: api_key,
          signature: signature,
          timestamp: timestamp.toString(),
          folder: folder,
        },
      });

      if (uploadResponse.status !== 200) {
        console.error('❌ [UploadService] Cloudinary Upload Failed:', {
          status: uploadResponse.status,
          body: uploadResponse.body,
          headers: uploadResponse.headers,
        });
        throw new Error(`Error al subir el archivo a Cloudinary (Status: ${uploadResponse.status})`);
      }

      return {
        key: publicId,
        publicUrl,
        fileName,
        fileType,
      };
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos
   */
  async uploadMultipleFiles(
    files: { uri: string; name: string; type: string }[],
    folder = 'uploads',
    onProgress?: (index: number, progress: number) => void
  ): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFile(
        file.uri,
        file.name,
        file.type,
        folder,
        (progress) => onProgress?.(i, progress)
      );
      uploadedFiles.push(result);
    }

    return uploadedFiles;
  }

  /**
   * Elimina un archivo de S3
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
   * Obtiene la URL de descarga de un archivo
   */
  async getDownloadUrl(key: string): Promise<string> {
    try {
      const response = await apiService.post('/uploads/presigned-download', {
        key,
      });
      return response.downloadUrl;
    } catch (error) {
      console.error('Error al obtener URL de descarga:', error);
      throw error;
    }
  }

  /**
   * Obtiene el tipo MIME desde la URI
   */
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
   * Sube una foto de perfil (avatar) a S3
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
   * Sube un informe PDF de inspección a S3
   */
  async uploadInspectionReport(
    file: { uri: string; name: string; mimeType?: string },
    inspectionId: string,
    token: string,
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
   * Sube documentos o fotos adicionales de la inspección a S3
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
