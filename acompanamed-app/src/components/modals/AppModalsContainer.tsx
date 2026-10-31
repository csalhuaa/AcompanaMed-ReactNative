import React from 'react';
import {
  Medicine,
  EmergencyProfile,
  ActorRole,
} from '../../domain';
import {
  AddMedicineModal,
  NewMedicineData,
} from './AddMedicineModal';
import { ClinicalReportModal } from './ClinicalReportModal';
import { RestockModal } from './RestockModal';
import { ConfirmDialogModal } from './ConfirmDialogModal';
import { FamilyPairingModal } from './FamilyPairingModal';
import { PillInspectionModal } from './PillInspectionModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { InAppDialogModal } from './InAppDialogModal';
import { InAppNoticeData, InAppConfirmData } from '../../data/initialData';

export interface AppModalsContainerProps {
  // Modal: Agregar / Editar medicamento
  isAddModalVisible: boolean;
  editingMedicine: Medicine | null;
  scheduleTimes: Record<string, string>;
  onCloseAddModal: () => void;
  onSaveMedicine: (data: NewMedicineData) => void;

  // Modal: Informe Clínico
  isReportModalVisible: boolean;
  clinicalReport: any;
  emergencyProfile: EmergencyProfile;
  onCloseReportModal: () => void;
  onExportReport: () => void;

  // Modal: Reposición de Stock
  isRestockModalVisible: boolean;
  restockingMedicine: Medicine | null;
  onCloseRestockModal: () => void;
  onConfirmRestock: (medicineId: string, quantityToAdd: number) => void;

  // Modal: Confirmación de Retiro de Fármaco
  isDeleteConfirmVisible: boolean;
  deletingMedicine: Medicine | null;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;

  // Modal: Configuración y Vinculación Familiar
  isFamilyPairingModalVisible: boolean;
  onCloseFamilyPairingModal: () => void;
  onUpdateProfile: (profile: EmergencyProfile) => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
  onTestNotification: () => void;
  activeRole: ActorRole;
  onSelectRole: (role: ActorRole) => void;
  familyCode: string;
  onConnectFamilyCode?: (code: string) => Promise<{ success: boolean; message: string }>;
  isSyncing?: boolean;
  lastSyncTime?: string;
  deviceId?: string;
  onRevokeDevice?: (devId: string) => Promise<boolean>;
  onResetDevice?: () => Promise<void> | void;

  // Modal: Lupa de Inspección de Pastilla
  inspectingMedicine: Medicine | null;
  onCloseInspection: () => void;
  onUpdatePhoto: (medId: string, newPhoto: string) => void;

  // Modal: Onboarding inicial
  isOnboardingVisible: boolean;
  isOnboardingBusy: boolean;
  onboardingError: string;
  onFinishOnboarding: (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo' | 'pair';
    patientName: string;
    pairCode?: string;
  }) => Promise<void> | void;

  // Notificaciones y Confirmaciones In-App
  activeNotice: InAppNoticeData | null;
  activeConfirm: InAppConfirmData | null;
  onCloseNotice: () => void;
  onCloseConfirm: () => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  isAddModalVisible,
  editingMedicine,
  scheduleTimes,
  onCloseAddModal,
  onSaveMedicine,

  isReportModalVisible,
  clinicalReport,
  emergencyProfile,
  onCloseReportModal,
  onExportReport,

  isRestockModalVisible,
  restockingMedicine,
  onCloseRestockModal,
  onConfirmRestock,

  isDeleteConfirmVisible,
  deletingMedicine,
  onCloseDeleteConfirm,
  onConfirmDelete,

  isFamilyPairingModalVisible,
  onCloseFamilyPairingModal,
  onUpdateProfile,
  onClearDemoData,
  onRestoreDemoData,
  onTestNotification,
  activeRole,
  onSelectRole,
  familyCode,
  onConnectFamilyCode,
  isSyncing,
  lastSyncTime,
  deviceId,
  onRevokeDevice,
  onResetDevice,

  inspectingMedicine,
  onCloseInspection,
  onUpdatePhoto,

  isOnboardingVisible,
  isOnboardingBusy,
  onboardingError,
  onFinishOnboarding,

  activeNotice,
  activeConfirm,
  onCloseNotice,
  onCloseConfirm,
}) => {
  return (
    <>
      <AddMedicineModal
        visible={isAddModalVisible}
        initialMedicine={editingMedicine}
        initialScheduleTime={editingMedicine ? scheduleTimes[editingMedicine.id] : '08:00'}
        onClose={onCloseAddModal}
        onSave={onSaveMedicine}
      />

      <ClinicalReportModal
        visible={isReportModalVisible}
        reportText={clinicalReport.formattedReportText}
        clinicalReport={clinicalReport}
        emergencyProfile={emergencyProfile}
        onClose={onCloseReportModal}
        onExport={onExportReport}
      />

      <RestockModal
        visible={isRestockModalVisible}
        medicine={restockingMedicine}
        onClose={onCloseRestockModal}
        onConfirmRestock={onConfirmRestock}
      />

      <ConfirmDialogModal
        visible={isDeleteConfirmVisible}
        title="Retirar del Pastillero Familiar"
        message={`¿Desea desvincular ${deletingMedicine?.name || 'este medicamento'} (${deletingMedicine?.doseDescription || ''})? Se conservará su historial médico de tomas anteriores.`}
        confirmText="Sí, retirar"
        cancelText="Cancelar"
        isDestructive={true}
        iconName="trash-can-outline"
        onConfirm={onConfirmDelete}
        onCancel={onCloseDeleteConfirm}
      />

      <FamilyPairingModal
        visible={isFamilyPairingModalVisible}
        onClose={onCloseFamilyPairingModal}
        emergencyProfile={emergencyProfile}
        onUpdateProfile={onUpdateProfile}
        onClearDemoData={onClearDemoData}
        onRestoreDemoData={onRestoreDemoData}
        onTestNotification={onTestNotification}
        activeRole={activeRole}
        onSelectRole={onSelectRole}
        familyCode={familyCode}
        onConnectFamilyCode={onConnectFamilyCode}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        currentDeviceId={deviceId}
        onRevokeDevice={onRevokeDevice}
        onResetDevice={onResetDevice}
      />

      <PillInspectionModal
        visible={!!inspectingMedicine}
        medicine={inspectingMedicine}
        onClose={onCloseInspection}
        onUpdatePhoto={onUpdatePhoto}
      />

      <OnboardingModal
        visible={isOnboardingVisible}
        busy={isOnboardingBusy}
        error={onboardingError}
        onFinishOnboarding={onFinishOnboarding}
      />

      <InAppDialogModal
        notice={activeNotice}
        confirm={activeConfirm}
        onCloseNotice={onCloseNotice}
        onCloseConfirm={onCloseConfirm}
      />
    </>
  );
};
