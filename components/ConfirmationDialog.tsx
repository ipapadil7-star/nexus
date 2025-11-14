


import React from 'react';
import { AlertIcon } from './icons/AlertIcon';
import clsx from 'clsx';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonClass?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ 
    title, 
    message, 
    onConfirm, 
    onCancel,
    confirmLabel,
    cancelLabel,
    confirmButtonClass
}) => {
  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl border border-purple-500/30 p-6 w-full max-w-md m-4 animate-fade-in-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <AlertIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-100">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-400">{message}</p>
                </div>
            </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className={clsx(
                "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors",
                confirmButtonClass || "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            )}
            onClick={onConfirm}
          >
            {confirmLabel || 'Konfirmasi'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            onClick={onCancel}
          >
            {cancelLabel || 'Batal'}
          </button>
        </div>
      </div>
    </div>
  );
};