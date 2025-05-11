'use client'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteConfirmModal ({
  isOpen,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
      <div className='bg-white p-6 rounded-lg shadow-md'>
        <h2 className='text-lg font-bold'>Delete Tweet</h2>
        <p>Are you sure you want to delete this tweet?</p>
        <div className='mt-4 flex justify-end space-x-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-neutral-300 rounded-md hover:bg-neutral-400'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
