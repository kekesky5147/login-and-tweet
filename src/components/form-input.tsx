interface FormInputProps {
  name: string
  type: string
  placeholder: string
  required: boolean
  errors?: string[]
}

export default function FormInput ({
  name,
  type,
  placeholder,
  required,
  errors
}: FormInputProps) {
  return (
    <div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className='border rounded p-2 w-full'
      />
      {errors && <p className='text-red-500 text-sm'>{errors.join(', ')}</p>}
    </div>
  )
}
