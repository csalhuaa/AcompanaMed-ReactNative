import {
  Medicine,
  DoseLog,
  EmergencyProfile,
  ClinicalSummaryReport,
  MedicationAdherenceBreakdown,
} from './types';
import { sanitizeEmergencyProfile } from './LocalWorkflow';

export function validateEmergencyProfile(rawProfile: EmergencyProfile): {
  isValid: boolean;
  errors: string[];
} {
  const profile = sanitizeEmergencyProfile(rawProfile);
  const errors: string[] = [];
  if (!profile.patientFullName.trim()) {
    errors.push('El nombre completo del paciente es requerido.');
  }
  if (!profile.emergencyContact || !profile.emergencyContact.phone.trim()) {
    errors.push('El contacto de emergencia debe incluir un número telefónico de auxilio.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateClinicalSummary(
  medicines: Medicine[],
  logs: DoseLog[],
  rawProfile: EmergencyProfile
): ClinicalSummaryReport {
  const profile = sanitizeEmergencyProfile(rawProfile);
  const clinicalWarnings: string[] = [];

  const medicationBreakdown: MedicationAdherenceBreakdown[] = medicines.map((med) => {
    const medLogs = logs.filter((l) => l.medicineId === med.id);
    const totalScheduled = medLogs.length;
    const totalTaken = medLogs.filter((l) => l.status === 'taken').length;

    const rate = totalScheduled === 0 ? 100 : Math.round((totalTaken / totalScheduled) * 100);

    let status: 'optimal' | 'regular' | 'deficient';
    if (rate >= 85) {
      status = 'optimal';
    } else if (rate >= 70) {
      status = 'regular';
    } else {
      status = 'deficient';
    }

    if (rate < 80 && totalScheduled > 0) {
      clinicalWarnings.push(
        `Alerta: ${med.name} presenta una adherencia de solo ${rate}%. Riesgo de ineficacia terapéutica.`
      );
    }

    return {
      medicineId: med.id,
      medicineName: med.name,
      doseDescription: med.doseDescription,
      totalScheduled,
      totalTaken,
      adherenceRate: rate,
      status,
    };
  });

  const overallTaken = logs.filter((l) => l.status === 'taken').length;
  const overallPercentage =
    logs.length === 0 ? 100 : Math.round((overallTaken / logs.length) * 100);

  // Generar texto estructurado para el geriatra
  const lines: string[] = [
    '====================================================',
    '       REPORTE CLÍNICO DE ADHERENCIA FARMACOLÓGICA   ',
    '                   ACOMPAÑAMED                      ',
    '====================================================',
    `Paciente: ${profile.patientFullName} (${profile.age ? `${profile.age} años` : 'Edad no registrada'})`,
    `Grupo Sanguíneo: ${profile.bloodType || 'No registrado'} | Seguro: ${profile.healthInsurance || 'No registrado'}`,
    `Alergias Conocidas: ${(profile.allergies || []).join(', ') || 'Ninguna reportada'}`,
    `Patologías Crónicas: ${(profile.chronicConditions || []).join(', ') || 'En evaluación'}`,
    `Contacto de Auxilio: ${profile.emergencyContact?.name || 'No registrado'} (${profile.emergencyContact?.relationship || 'Contacto'}) - Tel: ${profile.emergencyContact?.phone || 'No registrado'}`,
    '----------------------------------------------------',
    `ADHERENCIA GLOBAL DEL TRATAMIENTO: ${overallPercentage}%`,
    '----------------------------------------------------',
    'DESGLOSE POR MEDICAMENTO:',
  ];

  medicationBreakdown.forEach((b) => {
    lines.push(
      `• ${b.medicineName} (${b.doseDescription}): ${b.adherenceRate}% (${b.totalTaken}/${b.totalScheduled} tomas) - Estado: ${b.status.toUpperCase()}`
    );
  });

  if (clinicalWarnings.length > 0) {
    lines.push('----------------------------------------------------');
    lines.push('ALERTAS CLÍNICAS:');
    clinicalWarnings.forEach((w) => lines.push(`[ALERTA] ${w}`));
  }

  lines.push('====================================================');

  return {
    patientName: profile.patientFullName,
    patientAge: profile.age,
    overallAdherencePercentage: overallPercentage,
    medicationBreakdown,
    clinicalWarnings,
    formattedReportText: lines.join('\n'),
  };
}
