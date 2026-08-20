import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDestructive ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
        }`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text)] mb-2" id="modal-title">{title}</h3>
        <p className="text-[var(--color-text-muted)] text-sm mb-6" id="modal-desc">
          {description}
        </p>
        <div className="flex w-full gap-3">
          <Button 
            variant="secondary" 
            className="flex-1" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'danger' : 'primary'} 
            className="flex-1" 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
