interface FormInputProps {
  type: string
  placeholder: string
  required: boolean
  errors?: string[]
  name: string
}

export default function FormInput ({
  type,
  placeholder,
  required,
  errors = [],
  name
}: FormInputProps) {
  return (
    <div className='flex flex-col gap-2'>
      <input
        name={name}
        className='bg-transparent rounded-md w-full h-10 focus:outline-none ring-1 focus:ring-1 transition ring-neutral-400 focus:ring-neutral-900 border-none placeholder:text-neutral-400 p-2'
        type={type}
        placeholder={placeholder}
        required={required}
      />
      {errors.map((error, index) => (
        <span key={index} className='text-red-500 font-medium'>
          {error}
        </span>
      ))}
    </div>
  )
}
