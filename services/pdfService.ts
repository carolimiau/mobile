import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Inspection } from '../types/inspection';
import { INSPECTION_SECTIONS } from '../constants/InspectionForm';

export const generateInspectionHtml = (inspection: Inspection) => {
  const vehicle = inspection.vehiculo || inspection.publicacion?.vehiculo;
  const mechanic = inspection.mecanico;
  const date = inspection.fechaCompletada 
    ? new Date(inspection.fechaCompletada).toLocaleDateString() 
    : new Date().toLocaleDateString();

  // Helper to find question text and answer text
  const getAnswerDetails = (questionId: string, value: string) => {
    for (const section of INSPECTION_SECTIONS) {
      for (const q of section.questions) {
        if (q.id === questionId) {
          const option = q.options.find(o => o.value === value);
          return {
            question: q.text,
            answer: option ? option.label : value
          };
        }
      }
    }
    return { question: questionId, answer: value };
  };

  let questionsHtml = '';
  
  // Assuming answers is an object like { "1.1": "a", "1.2": "b" }
  if (inspection.answers) {
    // Sort keys to maintain order roughly if possible, or iterate sections
    INSPECTION_SECTIONS.forEach(section => {
      const sectionQuestions = section.questions.filter(q => inspection.answers[q.id]);
      
      if (sectionQuestions.length > 0) {
        questionsHtml += `
          <div class="section">
            <h3>${section.title}</h3>
            ${sectionQuestions.map(q => {
              const val = inspection.answers[q.id];
              const details = getAnswerDetails(q.id, val);
              const color = val === 'a' ? '#4CAF50' : val === 'b' ? '#FFC107' : '#F44336';
              return `
                <div class="question-row">
                  <div class="question-text">${details.question}</div>
                  <div class="answer-text" style="color: ${color}">${details.answer}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    });

    // Handle comments if any (Assuming comments is object { "1.1": "text" })
    if (inspection.comments) {
        questionsHtml += `<div class="section"><h3>Comentarios Técnicos</h3>`;
        Object.entries(inspection.comments).forEach(([k, v]) => {
            if (!v) return;
             // Try to find question title
            const details = getAnswerDetails(k, '');
            questionsHtml += `
            <div class="comment-row">
                <div class="comment-label">Ref: ${details.question.substring(0, 50)}...</div>
                <div class="comment-text">${v}</div>
            </div>`;
        });
        questionsHtml += `</div>`;
    }
  }

  const html = `
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
      
      .question-row { margin-bottom: 12px; padding-left: 10px; }
      .question-text { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
      .answer-text { font-size: 12px; }

      .score-summary { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
      
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
          <div class="value">${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio}</div>
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
      ${questionsHtml || '<p>No hay respuestas registradas.</p>'}
    </div>

    <div class="footer">
      Generado por AutoBox App
    </div>
  </body>
</html>
  `;
  return html;
};

export const downloadInspectionPdf = async (inspection: Inspection) => {
  try {
    const html = generateInspectionHtml(inspection);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
