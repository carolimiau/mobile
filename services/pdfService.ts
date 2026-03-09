import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Inspection } from '../types/inspection';
import apiService from './apiService';

interface InspectionAnswerFull {
  id: string;
  preguntaId: number;
  respuestaOpcionId?: number;
  respuestaTextoManual?: string;
  imagen_url?: string;
  pregunta?: { id: number; pregunta: string };
  respuestaOpcion?: { id: number; respuestaTexto: string; calificacion: number };
}

interface FullInspection extends Inspection {
  inspectionAnswers?: InspectionAnswerFull[];
  score?: number;
  maxScore?: number;
}

export const generateInspectionHtml = (inspection: FullInspection): string => {
  const vehicle = inspection.vehiculo || inspection.publicacion?.vehiculo;
  const mechanic = inspection.mecanico;
  const date = inspection.fechaCompletada
    ? new Date(inspection.fechaCompletada).toLocaleDateString('es-CL')
    : new Date().toLocaleDateString('es-CL');

  const answers: InspectionAnswerFull[] = inspection.inspectionAnswers || [];

  const answersWithOption = answers.filter(a => a.respuestaOpcion && a.pregunta);
  const standaloneAnswers = answers.filter(a => !a.respuestaOpcion && (a.imagen_url || a.respuestaTextoManual));

  let questionsHtml = '';

  if (answersWithOption.length > 0) {
    questionsHtml += `<div class="section"><h3>Resultados de la Inspección</h3>`;
    answersWithOption.forEach(answer => {
      const calificacion = answer.respuestaOpcion!.calificacion;
      const color = calificacion >= 2 ? '#4CAF50' : calificacion === 1 ? '#FFC107' : '#F44336';
      questionsHtml += `
        <div class="question-row">
          <div class="question-text">${answer.pregunta!.pregunta}</div>
          <div class="answer-text" style="color:${color}">${answer.respuestaOpcion!.respuestaTexto}</div>
          ${answer.respuestaTextoManual ? `<div class="comment-text">Nota: ${answer.respuestaTextoManual}</div>` : ''}
          ${answer.imagen_url ? `<img class="answer-img" src="${answer.imagen_url}" />` : ''}
        </div>`;
    });
    questionsHtml += `</div>`;
  }

  if (standaloneAnswers.length > 0) {
    questionsHtml += `<div class="section"><h3>Fotografías y Observaciones</h3>`;
    standaloneAnswers.forEach(answer => {
      questionsHtml += `
        <div class="question-row">
          ${answer.pregunta ? `<div class="question-text">${answer.pregunta.pregunta}</div>` : ''}
          ${answer.imagen_url ? `<img class="answer-img" src="${answer.imagen_url}" />` : ''}
          ${answer.respuestaTextoManual ? `<div class="comment-text">${answer.respuestaTextoManual}</div>` : ''}
        </div>`;
    });
    questionsHtml += `</div>`;
  }

  if (answers.length === 0) {
    questionsHtml = '<p style="color:#999;text-align:center">No hay respuestas registradas.</p>';
  }

  const scoreHtml =
    inspection.score !== undefined && inspection.maxScore && inspection.maxScore > 0
      ? `<div class="score-summary">Puntuación: ${inspection.score}/${inspection.maxScore} pts (${Math.round((inspection.score / inspection.maxScore) * 100)}%)</div>`
      : '';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
      body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      .title { font-size: 24px; font-weight: bold; color: #E65100; margin: 0; }
      .subtitle { font-size: 14px; color: #666; margin-top: 5px; }

      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
      .info-item { margin-bottom: 5px; }
      .label { font-weight: bold; font-size: 12px; color: #666; }
      .value { font-size: 14px; }

      .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
      .section h3 { margin: 0 0 10px 0; font-size: 16px; background: #E65100; color: white; padding: 5px 10px; border-radius: 4px; }

      .question-row { margin-bottom: 14px; padding-left: 10px; border-left: 3px solid #eee; padding-bottom: 8px; }
      .question-text { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
      .answer-text { font-size: 12px; }
      .comment-text { font-size: 11px; color: #666; margin-top: 4px; font-style: italic; }
      .answer-img { max-width: 100%; max-height: 220px; border-radius: 6px; margin-top: 8px; object-fit: cover; display: block; }

      .score-summary { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #E65100; }
      .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="title">Informe de Inspección AutoBox</h1>
      <div class="subtitle">ID: ${inspection.id} | Fecha: ${date}</div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-item">
          <div class="label">VEHÍCULO</div>
          <div class="value">${vehicle?.marca ?? ''} ${vehicle?.modelo ?? ''} ${vehicle?.anio ?? ''}</div>
        </div>
        <div class="info-item">
          <div class="label">PATENTE</div>
          <div class="value">${vehicle?.patente || 'N/A'}</div>
        </div>
      </div>
      <div>
        <div class="info-item">
          <div class="label">MECÁNICO</div>
          <div class="value">${mechanic ? `${mechanic.primerNombre} ${mechanic.primerApellido}` : 'No asignado'}</div>
        </div>
        <div class="info-item">
          <div class="label">ESTADO</div>
          <div class="value">${inspection.estado_insp}</div>
        </div>
      </div>
    </div>

    <div class="content">
      ${questionsHtml}
    </div>

    ${scoreHtml}

    <div class="footer">
      Generado por AutoBox App
    </div>
  </body>
</html>`;
};

export const downloadInspectionPdf = async (inspection: Inspection) => {
  try {
    let fullInspection: FullInspection = inspection as FullInspection;
    if (!fullInspection.inspectionAnswers || fullInspection.inspectionAnswers.length === 0) {
      fullInspection = await apiService.get(`/inspections/${inspection.id}`);
    }

    const html = generateInspectionHtml(fullInspection);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
