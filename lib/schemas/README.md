# Enterprise Schemas con Zod

Este archivo contiene los schemas de validación para empresas usando Zod.

## Schemas Disponibles

### `createEnterpriseSchema`
Schema para crear una nueva empresa. Todos los campos son **requeridos**.

**Campos:**
- `name`: Nombre de la empresa (2-255 caracteres)
- `rut`: RUT en formato chileno (ej: 12345678-9)
- `address`: Dirección (5-500 caracteres)
- `phone`: Teléfono (8-20 caracteres, solo números, espacios, guiones y paréntesis)
- `user_id`: ID del usuario (número entero positivo)

### `updateEnterpriseSchema`
Schema para actualizar una empresa. Todos los campos son **opcionales**.

**Campos:** Los mismos que `createEnterpriseSchema` pero opcionales.

### `updateEnterpriseSchemaPartial`
Schema que requiere al menos un campo para actualizar.

## Tipos TypeScript

```typescript
type CreateEnterpriseFormData = z.infer<typeof createEnterpriseSchema>;
type UpdateEnterpriseFormData = z.infer<typeof updateEnterpriseSchema>;
```

## Ejemplo de uso con React Hook Form

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEnterpriseSchema, CreateEnterpriseFormData } from "@/lib/schemas/enterprise.schema";

function CreateEnterpriseForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateEnterpriseFormData>({
    resolver: zodResolver(createEnterpriseSchema)
  });

  const onSubmit = async (data: CreateEnterpriseFormData) => {
    // Los datos ya están validados por Zod
    const result = await createEnterpriseAction(data);
    if (result.success) {
      // Éxito
    } else {
      // Error: result.error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name")}
        placeholder="Nombre de la empresa"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input
        {...register("rut")}
        placeholder="RUT (ej: 12345678-9)"
      />
      {errors.rut && <span>{errors.rut.message}</span>}
      
      <textarea
        {...register("address")}
        placeholder="Dirección"
      />
      {errors.address && <span>{errors.address.message}</span>}
      
      <input
        {...register("phone")}
        placeholder="Teléfono"
      />
      {errors.phone && <span>{errors.phone.message}</span>}
      
      <input
        {...register("user_id", { valueAsNumber: true })}
        type="number"
        placeholder="ID de usuario"
      />
      {errors.user_id && <span>{errors.user_id.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creando..." : "Crear Empresa"}
      </button>
    </form>
  );
}
```

## Validaciones Implementadas

### Nombre
- Requerido
- Mínimo 2 caracteres
- Máximo 255 caracteres
- Se aplica trim()

### RUT
- Requerido
- Formato: números-dígito verificador (ej: 12345678-9)
- Acepta K mayúscula o minúscula como dígito verificador
- Se aplica trim()

### Dirección
- Requerida
- Mínimo 5 caracteres
- Máximo 500 caracteres
- Se aplica trim()

### Teléfono
- Requerido
- Solo números, espacios, guiones y paréntesis
- Mínimo 8 caracteres
- Máximo 20 caracteres
- Acepta formato internacional con +
- Se aplica trim()

### User ID
- Requerido
- Debe ser un número entero
- Debe ser positivo

## Mensajes de Error

Todos los mensajes de error están en español y son descriptivos para el usuario final.
