---
title: Idea Vending
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# Idea Vending

Base URLs:

* <a href="https://api-ideavending.ideasdigitales.dev">QA (admin): https://api-ideavending.ideasdigitales.dev</a>

* <a href="https://api-ideavending.ideasdigitales.dev">QA (customer): https://api-ideavending.ideasdigitales.dev</a>

# Authentication

- HTTP Authentication, scheme: bearer

# Auth

## POST Obtener token JWT

POST /api/token

> Body Parameters

```json
{
  "email": "{{user_email}}",
  "password": "{{user_password}}"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Accept|header|string| no |none|
|body|body|object| yes |none|
|» email|body|string| yes |none|
|» password|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "token": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Token generado correctamente|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» token|string|false|none||none|

## DELETE Cerrar sesión y revocar token

DELETE /api/logout

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Accept|header|string| no |none|

> Response Examples

> 200 Response

```json
{
  "message": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Logout exitoso|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|No autenticado|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» message|string|false|none||none|

# User

## POST Create user

POST /api/users

Registra un usuario en el sistema.
Roles de usuario disponibles:
- admin
- technician
- customer

> Body Parameters

```json
{
  "name": "Mr. Roderick Stehr",
  "email": "Santa47@hotmail.com",
  "rut": "DONOTMODIFY",
  "password": "8uD26yCtqms2",
  "password_confirmation": "8uD26yCtqms2",
  "role": "admin"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Accept|header|string| no |none|
|body|body|[UserCreationResource](#schemausercreationresource)| no |none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "name": "string",
    "email": "string",
    "rut": "DONOTMODIFY",
    "id": 0,
    "email_verified_at": "string",
    "remember_token": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»» name|string|false|none||none|
|»»» email|string|false|none||none|
|»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» email_verified_at|string¦null|false|none||none|
|»»» remember_token|string¦null|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of users

GET /api/users

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|include|query|string| no |Relaciones|
|page|query|string| no |Número de página|
|limit|query|string| no |Tamaño de página|
|Accept|header|string| no |none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "email": "string",
      "rut": "DONOTMODIFY",
      "id": 0,
      "email_verified_at": "string",
      "remember_token": "string",
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» UserResource|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»»» name|string|false|none||none|
|»»»» email|string|false|none||none|
|»»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» email_verified_at|string¦null|false|none||none|
|»»»» remember_token|string¦null|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for users

POST /api/users/search

> Body Parameters

```json
{
  "filters": [
    {
      "field": "name",
      "operator": "like",
      "value": "%Timothy%"
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|include|query|string| no |relaciones a incluir en la respuesta (separadas por coma)|
|page|query|string| no |Número de página|
|limit|query|string| no |Tamaño de página|
|Accept|header|string| no |none|
|body|body|object| no |none|
|» filters|body|[object]| no |Filtros|
|»» type|body|string| no |none|
|»» field|body|string| no |none|
|»» operator|body|string| no |none|
|»» value|body|string| no |none|
|»» nested|body|[object]| no |none|
|»»» type|body|string| no |none|
|»»» field|body|string| no |none|
|»»» operator|body|string| no |none|
|»»» value|body|string| no |none|
|» search|body|object| no |Búsqueda de texto completo|
|»» value|body|string| no |Campos: email, name y rut|
|»» case_sensitive|body|boolean| no |(default: true)|

#### Description

**include**: relaciones a incluir en la respuesta (separadas por coma)
roles (roles de usuario)
permissions (permisos de usuario)
mqttUser (usuario en EMQX)
enterprises (empresas relacionadas con usuario)

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|name|
|»» field|email|
|»» field|rut|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|name|
|»»» field|email|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "email": "string",
      "rut": "DONOTMODIFY",
      "id": 0,
      "email_verified_at": "string",
      "remember_token": "string",
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» UserResource|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»»» name|string|false|none||none|
|»»»» email|string|false|none||none|
|»»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» email_verified_at|string¦null|false|none||none|
|»»»» remember_token|string¦null|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## GET Get user (relaciones)

GET /api/users/{user}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|user|path|integer| yes |none|
|include|query|string| no |none|
|Accept|header|string| no |none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "email": "string",
    "rut": "DONOTMODIFY",
    "id": 0,
    "email_verified_at": "string",
    "remember_token": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»» name|string|false|none||none|
|»»» email|string|false|none||none|
|»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» email_verified_at|string¦null|false|none||none|
|»»» remember_token|string¦null|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## PATCH Update user

PATCH /api/users/{user}

> Body Parameters

```json
{
  "name": "Nuevo Nombre",
  "status": "active",
  "role": "customer",
  "password": "password",
  "password_confirmation": "password"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|user|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[User](#schemauser)| no | User|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "email": "string",
    "rut": "DONOTMODIFY",
    "id": 0,
    "email_verified_at": "string",
    "remember_token": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»» name|string|false|none||none|
|»»» email|string|false|none||none|
|»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» email_verified_at|string¦null|false|none||none|
|»»» remember_token|string¦null|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete user

DELETE /api/users/{user}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|user|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "email": "string",
    "rut": "DONOTMODIFY",
    "id": 0,
    "email_verified_at": "string",
    "remember_token": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|UserResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[User](#schemauser)|false|none|User|none|
|»»» name|string|false|none||none|
|»»» email|string|false|none||none|
|»»» rut|string|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» email_verified_at|string¦null|false|none||none|
|»»» remember_token|string¦null|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## POST Get reset link

POST /api/password/forgot

Envía un enlace para restaurar la contraseña de un usuario

> Body Parameters

```json
{
  "email": "user2@example.com"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|[ForgotPasswordResource](#schemaforgotpasswordresource)| no ||none|

> Response Examples

> 201 Response

```json
{
  "message": "reset link has been sent"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» message|string|true|none||Reset status|

## POST Reset password

POST /api/password/reset

Envía un enlace para restaurar la contraseña de un usuario

> Body Parameters

```json
{
  "email": "user2@example.com",
  "password": "2c2Z451lioAx",
  "password_confirmation": "2c2Z451lioAx",
  "token": "4a88a6241bf1859133a42a774bcc896f7898cae69867fd1099b0dd5d04f7f6eb"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|[RestorePasswordResource](#schemarestorepasswordresource)| no | RestorePasswordResource|none|

> Response Examples

> 201 Response

```json
{
  "message": "reset link has been sent"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» message|string|true|none||Reset status|

# Enterprise

## POST Create enterprise

POST /api/enterprises

> Body Parameters

```json
{
  "name": "Samuel Enterprises SpA",
  "address": "666 Mexico city",
  "phone": "(785) 591-2122",
  "rut": "77.123.321-K",
  "user_id": 67
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|[Enterprise](#schemaenterprise)| no | Enterprise|none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "rut": "string",
    "user_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»» name|string|true|none||none|
|»»» address|string¦null|false|none||none|
|»»» phone|string¦null|false|none||none|
|»»» rut|string|true|none||none|
|»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of enterprises

GET /api/enterprises

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||Relaciones|
|page|query|string| no ||Número de página|
|limit|query|string| no ||Tamaño de página|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "address": "string",
      "phone": "string",
      "rut": "string",
      "user_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» EnterpriseResource|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»»» name|string|true|none||none|
|»»»» address|string¦null|false|none||none|
|»»»» phone|string¦null|false|none||none|
|»»»» rut|string|true|none||none|
|»»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for enterprises

POST /api/enterprises/search

> Body Parameters

```json
{
  "filters": [
    {
      "field": "name",
      "operator": "ilike",
      "value": "%samue%"
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: name, address, rut|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|
|» includes|body|[object]| no ||none|
|»» relation|body|string| no ||none|
|»» filters|body|object| no ||none|
|»»» type|body|any| no ||none|
|»»» items|body|object| no ||none|
|»»»» type|body|string| no ||none|
|»»»» field|body|string| no ||none|
|»»»» operator|body|string| no ||none|
|»»»» value|body|string| no ||none|
|»»»» nested|body|[object]| no ||none|
|»»»»» type|body|string| no ||none|
|»»»»» field|body|string| no ||none|
|»»»»» operator|body|string| no ||none|
|»»»»» value|body|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|name|
|»» field|rut|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|name|
|»»» field|rut|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|
|»» relation|owner|
|»» relation|users|
|»» relation|machines|
|»»»» type|and|
|»»»» type|or|
|»»»» field|name|
|»»»» field|rut|
|»»»» operator|<|
|»»»» operator|<=|
|»»»» operator|>|
|»»»» operator|>=|
|»»»» operator|=|
|»»»» operator|!=|
|»»»» operator|like|
|»»»» operator|not like|
|»»»» operator|ilike|
|»»»» operator|not ilike|
|»»»» operator|in|
|»»»» operator|not in|
|»»»» operator|all in|
|»»»» operator|any in|
|»»»»» type|and|
|»»»»» type|or|
|»»»»» field|name|
|»»»»» field|rut|
|»»»»» operator|<|
|»»»»» operator|<=|
|»»»»» operator|>|
|»»»»» operator|>=|
|»»»»» operator|=|
|»»»»» operator|!=|
|»»»»» operator|like|
|»»»»» operator|not like|
|»»»»» operator|ilike|
|»»»»» operator|not ilike|
|»»»»» operator|in|
|»»»»» operator|not in|
|»»»»» operator|all in|
|»»»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "address": "string",
      "phone": "string",
      "rut": "string",
      "user_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» EnterpriseResource|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»»» name|string|true|none||none|
|»»»» address|string¦null|false|none||none|
|»»»» phone|string¦null|false|none||none|
|»»»» rut|string|true|none||none|
|»»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## GET Get enterprise

GET /api/enterprises/{enterprise}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|enterprise|path|integer| yes ||none|
|include|query|string| no ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "rut": "string",
    "user_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»» name|string|true|none||none|
|»»» address|string¦null|false|none||none|
|»»» phone|string¦null|false|none||none|
|»»» rut|string|true|none||none|
|»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## PATCH Update enterprise

PATCH /api/enterprises/{enterprise}

> Body Parameters

```json
{
  "name": "Louis Mraz",
  "address": "43031 Trevor Cliff",
  "phone": "(506) 386-5917"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|enterprise|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[Enterprise](#schemaenterprise)| no | Enterprise|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "rut": "string",
    "user_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»» name|string|true|none||none|
|»»» address|string¦null|false|none||none|
|»»» phone|string¦null|false|none||none|
|»»» rut|string|true|none||none|
|»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete enterprise

DELETE /api/enterprises/{enterprise}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|enterprise|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "rut": "string",
    "user_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|EnterpriseResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Enterprise](#schemaenterprise)|false|none|Enterprise|none|
|»»» name|string|true|none||none|
|»»» address|string¦null|false|none||none|
|»»» phone|string¦null|false|none||none|
|»»» rut|string|true|none||none|
|»»» user_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

# Vending Machine

## POST Asociar Maquina a Usuarios

POST /api/machines/{machine}/users

Asocia maquina a usuarios

> Body Parameters

```json
{
  "users": [
    1
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|string| yes ||none|
|Accept|header|string| no ||none|
|body|body|object| yes ||none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|

### Responses Data Schema

## POST Create vending machine

POST /api/machines

> Body Parameters

```json
{
  "name": "MACHINE_8390166",
  "location": "Rambla Lorena 934 Edificio 3",
  "client_id": "CLIENT_9973684",
  "type": "MDB-DEX",
  "enterprise_id": 87,
  "mqtt_user": {
    "username": "Yolanda.NunezSierra72",
    "password": "HDyRxxZHzj6OfQA"
  }
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|[VendingMachineCreation](#schemavendingmachinecreation)| no | VendingMachineCreation|none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "name": "MACHINE_7812934",
    "status": "Maintenance",
    "is_enabled": true,
    "location": "Paseo Eje 5 428 Puerta 220",
    "client_id": "CLIENT_6198672",
    "type": "MDB-DEX",
    "enterprise_id": 89,
    "mqtt_username": "machine_6440720",
    "mqtt_password": "aZbAow7t55H3yaZ",
    "id": 97,
    "created_at": "2026-01-21T01:31:51.690Z",
    "updated_at": "2025-11-09"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»» name|string|false|none||none|
|»»» status|string|false|none||none|
|»»» is_enabled|boolean|false|none||none|
|»»» location|string¦null|false|none||none|
|»»» client_id|string|false|none||none|
|»»» type|string¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|
|»»» mqtt_username|string¦null|false|none||none|
|»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

## GET Get a list of vending machines

GET /api/machines

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||Relaciones|
|page|query|string| no ||Número de página|
|limit|query|string| no ||Tamaño de página|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "status": "Inactive",
      "is_enabled": true,
      "location": "string",
      "client_id": "string",
      "type": "MDB ",
      "enterprise_id": 0,
      "mqtt_username": "string",
      "mqtt_password": "string",
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineResource|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»»» name|string|false|none||none|
|»»»» status|string|false|none||none|
|»»»» is_enabled|boolean|false|none||none|
|»»»» location|string¦null|false|none||none|
|»»»» client_id|string|false|none||none|
|»»»» type|string¦null|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|
|»»»» mqtt_username|string¦null|false|none||none|
|»»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

## POST Search for vending machines

POST /api/machines/search

> Body Parameters

```json
{
  "filters": [
    {
      "field": "is_enabled",
      "operator": "=",
      "value": "0"
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|Content-Type|header|string| no ||none|
|body|body|object| yes ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: name, status, is_enabled, location, enterprise_id, client_id, type|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|
|» includes|body|[object]| no ||none|
|»» relation|body|string| no ||none|
|»» filters|body|object| no ||none|
|»»» type|body|any| no ||none|
|»»» items|body|object| no ||none|
|»»»» type|body|string| no ||none|
|»»»» field|body|string| no ||none|
|»»»» operator|body|string| no ||none|
|»»»» value|body|string| no ||none|
|»»»» nested|body|[object]| no ||none|
|»»»»» type|body|string| no ||none|
|»»»»» field|body|string| no ||none|
|»»»»» operator|body|string| no ||none|
|»»»»» value|body|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|name|
|»» field|status|
|»» field|is_enabled|
|»» field|location|
|»» field|enterprise_id|
|»» field|client_id|
|»» field|type|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»» relation|users|
|»» relation|enterprise|
|»»»» type|and|
|»»»» type|or|
|»»»» field|name|
|»»»» field|status|
|»»»» field|is_enabled|
|»»»» field|location|
|»»»» field|enterprise_id|
|»»»» field|client_id|
|»»»» field|type|
|»»»» operator|<|
|»»»» operator|<=|
|»»»» operator|>|
|»»»» operator|>=|
|»»»» operator|=|
|»»»» operator|!=|
|»»»» operator|like|
|»»»» operator|not like|
|»»»» operator|ilike|
|»»»» operator|not ilike|
|»»»» operator|in|
|»»»» operator|not in|
|»»»» operator|all in|
|»»»» operator|any in|
|»»»»» type|and|
|»»»»» type|or|
|»»»»» field|name|
|»»»»» field|status|
|»»»»» field|is_enabled|
|»»»»» field|location|
|»»»»» field|enterprise_id|
|»»»»» field|client_id|
|»»»»» field|type|
|»»»»» operator|<|
|»»»»» operator|<=|
|»»»»» operator|>|
|»»»»» operator|>=|
|»»»»» operator|=|
|»»»»» operator|!=|
|»»»»» operator|like|
|»»»»» operator|not like|
|»»»»» operator|ilike|
|»»»»» operator|not ilike|
|»»»»» operator|in|
|»»»»» operator|not in|
|»»»»» operator|all in|
|»»»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "status": "Inactive",
      "is_enabled": true,
      "location": "string",
      "client_id": "string",
      "type": "MDB ",
      "enterprise_id": 0,
      "mqtt_username": "string",
      "mqtt_password": "string",
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineResource|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»»» name|string|false|none||none|
|»»»» status|string|false|none||none|
|»»»» is_enabled|boolean|false|none||none|
|»»»» location|string¦null|false|none||none|
|»»»» client_id|string|false|none||none|
|»»»» type|string¦null|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|
|»»»» mqtt_username|string¦null|false|none||none|
|»»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

## GET Get vending machine

GET /api/machines/{machine}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|include|query|string| no ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "status": "Inactive",
    "is_enabled": true,
    "location": "string",
    "client_id": "string",
    "type": "MDB ",
    "enterprise_id": 0,
    "mqtt_username": "string",
    "mqtt_password": "string",
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»» name|string|false|none||none|
|»»» status|string|false|none||none|
|»»» is_enabled|boolean|false|none||none|
|»»» location|string¦null|false|none||none|
|»»» client_id|string|false|none||none|
|»»» type|string¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|
|»»» mqtt_username|string¦null|false|none||none|
|»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

## PATCH Update vending machine

PATCH /api/machines/{machine}

> Body Parameters

```json
{
  "name": "MACHINE_2605336",
  "location": "Carretera Laura Segovia, 7 Puerta 678",
  "client_id": "CLIENT_5493308",
  "type": "MDB-DEX",
  "enterprise_id": 77,
  "mqtt_user": {
    "username": "Lilia69",
    "password": "SaKo4KAv7rZaX65"
  }
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[VendingMachineUpdate](#schemavendingmachineupdate)| no | VendingMachineUpdate|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "MACHINE_4553941",
    "status": "Active",
    "is_enabled": true,
    "location": "Huerta Reina Rojas, 1 Edificio 8",
    "client_id": "CLIENT_1030551",
    "type": "PULSES",
    "enterprise_id": 68,
    "mqtt_username": "machine_1206895",
    "mqtt_password": "BIgEG8BToCWBpw2",
    "id": 26,
    "created_at": "2026-01-20T07:22:30.627Z",
    "updated_at": "2026-09-06"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»» name|string|false|none||none|
|»»» status|string|false|none||none|
|»»» is_enabled|boolean|false|none||none|
|»»» location|string¦null|false|none||none|
|»»» client_id|string|false|none||none|
|»»» type|string¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|
|»»» mqtt_username|string¦null|false|none||none|
|»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

## DELETE Delete vending machine

DELETE /api/machines/{machine}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "status": "Inactive",
    "is_enabled": true,
    "location": "string",
    "client_id": "string",
    "type": "MDB ",
    "enterprise_id": 0,
    "mqtt_username": "string",
    "mqtt_password": "string",
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachine](#schemavendingmachine)|false|none|VendingMachine|none|
|»»» name|string|false|none||none|
|»»» status|string|false|none||none|
|»»» is_enabled|boolean|false|none||none|
|»»» location|string¦null|false|none||none|
|»»» client_id|string|false|none||none|
|»»» type|string¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|
|»»» mqtt_username|string¦null|false|none||none|
|»»» mqtt_password|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

# Product

## POST Create product

POST /api/products

> Body Parameters

```json
{
  "name": "Bespoke Fresh Pants",
  "enterprise_id": 5
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|[Product](#schemaproduct)| no | Product|none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "name": "string",
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»» name|string|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of products

GET /api/products

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "enterprise_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» ProductResource|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»»» name|string|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for products

POST /api/products/search

> Body Parameters

```json
{
  "filters": [
    {
      "field": "name",
      "operator": "ilike",
      "value": "%leche%"
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: name|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|name|
|»» field|enterprise_id|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|name|
|»»» field|enterprise_id|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "name": "string",
      "enterprise_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» ProductResource|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»»» name|string|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## GET Get product

GET /api/products/{product}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|product|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»» name|string|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## PATCH Update product

PATCH /api/products/{product}

> Body Parameters

```json
{
  "name": "Producto actualizado"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|product|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[Product](#schemaproduct)| no | Product|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»» name|string|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete product

DELETE /api/products/{product}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|product|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "name": "string",
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|ProductResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Product](#schemaproduct)|false|none|Product|none|
|»»» name|string|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

# Machine Cell

## POST Create vending machines cell

POST /api/machines/{machine}/cells

> Body Parameters

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "cell": 0,
  "product_stock": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[VendingMachineCell](#schemavendingmachinecell)| no | VendingMachineCell|none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "cell": 0,
    "product_stock": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» cell|integer|false|none||none|
|»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of vending machines cells

GET /api/machines/{machine}/cells

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "vending_machine_id": 0,
      "product_id": 0,
      "cell": 0,
      "product_stock": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineCellResource|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»»» vending_machine_id|integer|false|none||none|
|»»»» product_id|integer¦null|false|none||none|
|»»»» cell|integer|false|none||none|
|»»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for vending machines cells

POST /api/machines/{machine}/cells/search

> Body Parameters

```json
{
  "filters": [
    {
      "type": "and",
      "field": "product_id",
      "operator": "<",
      "value": "string",
      "nested": [
        {
          "type": "and",
          "field": "product_id",
          "operator": "<",
          "value": "string"
        }
      ]
    }
  ],
  "search": {
    "value": "string",
    "case_sensitive": true
  }
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: cell|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|product_id|
|»» field|cell|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|product_id|
|»»» field|cell|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "vending_machine_id": 0,
      "product_id": 0,
      "cell": 0,
      "product_stock": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineCellResource|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»»» vending_machine_id|integer|false|none||none|
|»»»» product_id|integer¦null|false|none||none|
|»»»» cell|integer|false|none||none|
|»»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## GET Get vending machines cell

GET /api/machines/{machine}/cells/{cell}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|cell|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "cell": 0,
    "product_stock": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» cell|integer|false|none||none|
|»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## PATCH Update vending machines cell

PATCH /api/machines/{machine}/cells/{cell}

> Body Parameters

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "cell": 0,
  "product_stock": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|cell|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[VendingMachineCell](#schemavendingmachinecell)| no | VendingMachineCell|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "cell": 0,
    "product_stock": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» cell|integer|false|none||none|
|»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete vending machines cell

DELETE /api/machines/{machine}/cells/{cell}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|cell|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "cell": 0,
    "product_stock": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineCellResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none|VendingMachineCell|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» cell|integer|false|none||none|
|»»» product_stock|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

# Channel

## POST Create vending machines channel

POST /api/machines/{machine}/channels

> Body Parameters

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "product_stock": 0,
  "pulses": 0,
  "unit": "string",
  "quantity": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[VendingMachineChannel](#schemavendingmachinechannel)| no | VendingMachineChannel|none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "product_stock": 0,
    "pulses": 0,
    "unit": "string",
    "quantity": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» product_stock|integer¦null|false|none||none|
|»»» pulses|integer|false|none||none|
|»»» unit|string|false|none||none|
|»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of vending machines channels

GET /api/machines/{machine}/channels

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "vending_machine_id": 0,
      "product_id": 0,
      "product_stock": 0,
      "pulses": 0,
      "unit": "string",
      "quantity": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineChannelResource|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»»» vending_machine_id|integer|false|none||none|
|»»»» product_id|integer¦null|false|none||none|
|»»»» product_stock|integer¦null|false|none||none|
|»»»» pulses|integer|false|none||none|
|»»»» unit|string|false|none||none|
|»»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for vending machines channels

POST /api/machines/{machine}/channels/search

> Body Parameters

```json
{
  "filters": [
    {
      "type": "and",
      "field": "product_id",
      "operator": "<",
      "value": "string",
      "nested": [
        {
          "type": "and",
          "field": "product_id",
          "operator": "<",
          "value": "string"
        }
      ]
    }
  ],
  "search": {
    "value": "string",
    "case_sensitive": true
  }
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: pulses, unit|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|

#### Enum

|Name|Value|
|---|---|
|»» type|and|
|»» type|or|
|»» field|product_id|
|»» field|pulses|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|product_id|
|»»» field|pulses|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "vending_machine_id": 0,
      "product_id": 0,
      "product_stock": 0,
      "pulses": 0,
      "unit": "string",
      "quantity": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» VendingMachineChannelResource|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»»» vending_machine_id|integer|false|none||none|
|»»»» product_id|integer¦null|false|none||none|
|»»»» product_stock|integer¦null|false|none||none|
|»»»» pulses|integer|false|none||none|
|»»»» unit|string|false|none||none|
|»»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## GET Get vending machines channel

GET /api/machines/{machine}/channels/{channel}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|channel|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "product_stock": 0,
    "pulses": 0,
    "unit": "string",
    "quantity": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» product_stock|integer¦null|false|none||none|
|»»» pulses|integer|false|none||none|
|»»» unit|string|false|none||none|
|»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## PATCH Update vending machines channel

PATCH /api/machines/{machine}/channels/{channel}

> Body Parameters

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "product_stock": 0,
  "pulses": 0,
  "unit": "string",
  "quantity": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|channel|path|integer| yes ||none|
|Accept|header|string| no ||none|
|body|body|[VendingMachineChannel](#schemavendingmachinechannel)| no | VendingMachineChannel|none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "product_stock": 0,
    "pulses": 0,
    "unit": "string",
    "quantity": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» product_stock|integer¦null|false|none||none|
|»»» pulses|integer|false|none||none|
|»»» unit|string|false|none||none|
|»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete vending machines channel

DELETE /api/machines/{machine}/channels/{channel}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||none|
|channel|path|integer| yes ||none|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "vending_machine_id": 0,
    "product_id": 0,
    "product_stock": 0,
    "pulses": 0,
    "unit": "string",
    "quantity": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|VendingMachineChannelResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none|VendingMachineChannel|none|
|»»» vending_machine_id|integer|false|none||none|
|»»» product_id|integer¦null|false|none||none|
|»»» product_stock|integer¦null|false|none||none|
|»»» pulses|integer|false|none||none|
|»»» unit|string|false|none||none|
|»»» quantity|integer|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

# Payment

## POST Create payment

POST /api/payments

> Body Parameters

```json
{
  "successful": true,
  "amount": 0,
  "date": "string",
  "product": "string",
  "response_code": 0,
  "response_message": "string",
  "commerce_code": "string",
  "terminal_id": "string",
  "authorization_code": 0,
  "last_digits": "string",
  "operation_number": "string",
  "card_type": "string",
  "card_brand": "string",
  "share_type": "string",
  "shares_number": 0,
  "shares_amount": 0,
  "machine_id": 0,
  "enterprise_id": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|
|body|body|[Payment](#schemapayment)| no | Payment|none|

#### Enum

|Name|Value|
|---|---|
|include|machine|

> Response Examples

> 201 Response

```json
{
  "data": {
    "successful": true,
    "amount": 0,
    "date": "string",
    "product": "string",
    "response_code": 0,
    "response_message": "string",
    "commerce_code": "string",
    "terminal_id": "string",
    "authorization_code": 0,
    "last_digits": "string",
    "operation_number": "string",
    "card_type": "string",
    "card_brand": "string",
    "share_type": "string",
    "shares_number": 0,
    "shares_amount": 0,
    "machine_id": 0,
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|PaymentResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Payment](#schemapayment)|false|none|Payment|none|
|»»» successful|boolean¦null|false|none||none|
|»»» amount|integer¦null|false|none||none|
|»»» date|string¦null|false|none||none|
|»»» product|string¦null|false|none||none|
|»»» response_code|integer¦null|false|none||none|
|»»» response_message|string¦null|false|none||none|
|»»» commerce_code|string¦null|false|none||none|
|»»» terminal_id|string¦null|false|none||none|
|»»» authorization_code|integer¦null|false|none||none|
|»»» last_digits|string¦null|false|none||none|
|»»» operation_number|string¦null|false|none||none|
|»»» card_type|string¦null|false|none||none|
|»»» card_brand|string¦null|false|none||none|
|»»» share_type|string¦null|false|none||none|
|»»» shares_number|integer¦null|false|none||none|
|»»» shares_amount|integer¦null|false|none||none|
|»»» machine_id|integer¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of payments

GET /api/payments

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|include|machine|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "successful": true,
      "amount": 0,
      "date": "string",
      "product": "string",
      "response_code": 0,
      "response_message": "string",
      "commerce_code": "string",
      "terminal_id": "string",
      "authorization_code": 0,
      "last_digits": "string",
      "operation_number": "string",
      "card_type": "string",
      "card_brand": "string",
      "share_type": "string",
      "shares_number": 0,
      "shares_amount": 0,
      "machine_id": 0,
      "enterprise_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» PaymentResource|any|false|none|PaymentResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Payment](#schemapayment)|false|none|Payment|none|
|»»»» successful|boolean¦null|false|none||none|
|»»»» amount|integer¦null|false|none||none|
|»»»» date|string¦null|false|none||none|
|»»»» product|string¦null|false|none||none|
|»»»» response_code|integer¦null|false|none||none|
|»»»» response_message|string¦null|false|none||none|
|»»»» commerce_code|string¦null|false|none||none|
|»»»» terminal_id|string¦null|false|none||none|
|»»»» authorization_code|integer¦null|false|none||none|
|»»»» last_digits|string¦null|false|none||none|
|»»»» operation_number|string¦null|false|none||none|
|»»»» card_type|string¦null|false|none||none|
|»»»» card_brand|string¦null|false|none||none|
|»»»» share_type|string¦null|false|none||none|
|»»»» shares_number|integer¦null|false|none||none|
|»»»» shares_amount|integer¦null|false|none||none|
|»»»» machine_id|integer¦null|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for payments

POST /api/payments/search

> Body Parameters

```json
{
  "filters": [
    {
      "type": "and",
      "field": "successful",
      "operator": "<",
      "value": "string",
      "nested": [
        {
          "type": "and",
          "field": "successful",
          "operator": "<",
          "value": "string"
        }
      ]
    }
  ],
  "search": {
    "value": "string",
    "case_sensitive": true
  },
  "includes": [
    {
      "relation": "machine",
      "filters": {
        "type": null,
        "items": {
          "type": "[",
          "field": "[",
          "operator": "[",
          "value": "string",
          "nested": [
            null
          ]
        }
      }
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: product, operation_number, card_brand, terminal_id, commerce_code|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|
|» includes|body|[object]| no ||none|
|»» relation|body|string| no ||none|
|»» filters|body|object| no ||none|
|»»» type|body|any| no ||none|
|»»» items|body|object| no ||none|
|»»»» type|body|string| no ||none|
|»»»» field|body|string| no ||none|
|»»»» operator|body|string| no ||none|
|»»»» value|body|string| no ||none|
|»»»» nested|body|[object]| no ||none|
|»»»»» type|body|string| no ||none|
|»»»»» field|body|string| no ||none|
|»»»»» operator|body|string| no ||none|
|»»»»» value|body|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|include|machine|
|»» type|and|
|»» type|or|
|»» field|successful|
|»» field|amount|
|»» field|date|
|»» field|product|
|»» field|response_code|
|»» field|commerce_code|
|»» field|terminal_id|
|»» field|enterprise_id|
|»» field|machine_id|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|successful|
|»»» field|amount|
|»»» field|date|
|»»» field|product|
|»»» field|response_code|
|»»» field|commerce_code|
|»»» field|terminal_id|
|»»» field|enterprise_id|
|»»» field|machine_id|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|
|»» relation|machine|
|»»»» type|and|
|»»»» type|or|
|»»»» field|successful|
|»»»» field|amount|
|»»»» field|date|
|»»»» field|product|
|»»»» field|response_code|
|»»»» field|commerce_code|
|»»»» field|terminal_id|
|»»»» field|enterprise_id|
|»»»» field|machine_id|
|»»»» operator|<|
|»»»» operator|<=|
|»»»» operator|>|
|»»»» operator|>=|
|»»»» operator|=|
|»»»» operator|!=|
|»»»» operator|like|
|»»»» operator|not like|
|»»»» operator|ilike|
|»»»» operator|not ilike|
|»»»» operator|in|
|»»»» operator|not in|
|»»»» operator|all in|
|»»»» operator|any in|
|»»»»» type|and|
|»»»»» type|or|
|»»»»» field|successful|
|»»»»» field|amount|
|»»»»» field|date|
|»»»»» field|product|
|»»»»» field|response_code|
|»»»»» field|commerce_code|
|»»»»» field|terminal_id|
|»»»»» field|enterprise_id|
|»»»»» field|machine_id|
|»»»»» operator|<|
|»»»»» operator|<=|
|»»»»» operator|>|
|»»»»» operator|>=|
|»»»»» operator|=|
|»»»»» operator|!=|
|»»»»» operator|like|
|»»»»» operator|not like|
|»»»»» operator|ilike|
|»»»»» operator|not ilike|
|»»»»» operator|in|
|»»»»» operator|not in|
|»»»»» operator|all in|
|»»»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "successful": true,
      "amount": 0,
      "date": "string",
      "product": "string",
      "response_code": 0,
      "response_message": "string",
      "commerce_code": "string",
      "terminal_id": "string",
      "authorization_code": 0,
      "last_digits": "string",
      "operation_number": "string",
      "card_type": "string",
      "card_brand": "string",
      "share_type": "string",
      "shares_number": 0,
      "shares_amount": 0,
      "machine_id": 0,
      "enterprise_id": 0,
      "id": 0,
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» PaymentResource|any|false|none|PaymentResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[Payment](#schemapayment)|false|none|Payment|none|
|»»»» successful|boolean¦null|false|none||none|
|»»»» amount|integer¦null|false|none||none|
|»»»» date|string¦null|false|none||none|
|»»»» product|string¦null|false|none||none|
|»»»» response_code|integer¦null|false|none||none|
|»»»» response_message|string¦null|false|none||none|
|»»»» commerce_code|string¦null|false|none||none|
|»»»» terminal_id|string¦null|false|none||none|
|»»»» authorization_code|integer¦null|false|none||none|
|»»»» last_digits|string¦null|false|none||none|
|»»»» operation_number|string¦null|false|none||none|
|»»»» card_type|string¦null|false|none||none|
|»»»» card_brand|string¦null|false|none||none|
|»»»» share_type|string¦null|false|none||none|
|»»»» shares_number|integer¦null|false|none||none|
|»»»» shares_amount|integer¦null|false|none||none|
|»»»» machine_id|integer¦null|false|none||none|
|»»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» created_at|string(date-time)¦null|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## PATCH Update payment

PATCH /api/payments/{payment}

> Body Parameters

```json
{
  "successful": true,
  "amount": 0,
  "date": "string",
  "product": "string",
  "response_code": 0,
  "response_message": "string",
  "commerce_code": "string",
  "terminal_id": "string",
  "authorization_code": 0,
  "last_digits": "string",
  "operation_number": "string",
  "card_type": "string",
  "card_brand": "string",
  "share_type": "string",
  "shares_number": 0,
  "shares_amount": 0,
  "machine_id": 0,
  "enterprise_id": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|payment|path|integer| yes ||none|
|include|query|string| no ||none|
|Accept|header|string| no ||none|
|body|body|[Payment](#schemapayment)| no | Payment|none|

#### Enum

|Name|Value|
|---|---|
|include|machine|

> Response Examples

> 200 Response

```json
{
  "data": {
    "successful": true,
    "amount": 0,
    "date": "string",
    "product": "string",
    "response_code": 0,
    "response_message": "string",
    "commerce_code": "string",
    "terminal_id": "string",
    "authorization_code": 0,
    "last_digits": "string",
    "operation_number": "string",
    "card_type": "string",
    "card_brand": "string",
    "share_type": "string",
    "shares_number": 0,
    "shares_amount": 0,
    "machine_id": 0,
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|PaymentResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Payment](#schemapayment)|false|none|Payment|none|
|»»» successful|boolean¦null|false|none||none|
|»»» amount|integer¦null|false|none||none|
|»»» date|string¦null|false|none||none|
|»»» product|string¦null|false|none||none|
|»»» response_code|integer¦null|false|none||none|
|»»» response_message|string¦null|false|none||none|
|»»» commerce_code|string¦null|false|none||none|
|»»» terminal_id|string¦null|false|none||none|
|»»» authorization_code|integer¦null|false|none||none|
|»»» last_digits|string¦null|false|none||none|
|»»» operation_number|string¦null|false|none||none|
|»»» card_type|string¦null|false|none||none|
|»»» card_brand|string¦null|false|none||none|
|»»» share_type|string¦null|false|none||none|
|»»» shares_number|integer¦null|false|none||none|
|»»» shares_amount|integer¦null|false|none||none|
|»»» machine_id|integer¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## DELETE Delete payment

DELETE /api/payments/{payment}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|payment|path|integer| yes ||none|
|include|query|string| no ||none|
|Accept|header|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|include|machine|

> Response Examples

> 200 Response

```json
{
  "data": {
    "successful": true,
    "amount": 0,
    "date": "string",
    "product": "string",
    "response_code": 0,
    "response_message": "string",
    "commerce_code": "string",
    "terminal_id": "string",
    "authorization_code": 0,
    "last_digits": "string",
    "operation_number": "string",
    "card_type": "string",
    "card_brand": "string",
    "share_type": "string",
    "shares_number": 0,
    "shares_amount": 0,
    "machine_id": 0,
    "enterprise_id": 0,
    "id": 0,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Resource not found|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|PaymentResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[Payment](#schemapayment)|false|none|Payment|none|
|»»» successful|boolean¦null|false|none||none|
|»»» amount|integer¦null|false|none||none|
|»»» date|string¦null|false|none||none|
|»»» product|string¦null|false|none||none|
|»»» response_code|integer¦null|false|none||none|
|»»» response_message|string¦null|false|none||none|
|»»» commerce_code|string¦null|false|none||none|
|»»» terminal_id|string¦null|false|none||none|
|»»» authorization_code|integer¦null|false|none||none|
|»»» last_digits|string¦null|false|none||none|
|»»» operation_number|string¦null|false|none||none|
|»»» card_type|string¦null|false|none||none|
|»»» card_brand|string¦null|false|none||none|
|»»» share_type|string¦null|false|none||none|
|»»» shares_number|integer¦null|false|none||none|
|»»» shares_amount|integer¦null|false|none||none|
|»»» machine_id|integer¦null|false|none||none|
|»»» enterprise_id|integer¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» created_at|string(date-time)¦null|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

# Activity Log

## POST Create activity log

POST /api/activitylog

> Body Parameters

```json
{
  "user_id": 0,
  "event_type": "string",
  "event_name": "string",
  "description": "string",
  "data": {},
  "ip_address": "string",
  "user_agent": "string"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|
|body|body|[ActivityLog](#schemaactivitylog)| no | ActivityLog|none|

#### Enum

|Name|Value|
|---|---|
|include|user|

> Response Examples

> 201 Response

```json
{
  "data": {
    "user_id": 0,
    "event_type": "string",
    "event_name": "string",
    "description": "string",
    "data": {},
    "ip_address": "string",
    "user_agent": "string",
    "id": 0,
    "updated_at": "2019-08-24T14:15:22Z"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation error|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|any|false|none|ActivityLogResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|[ActivityLog](#schemaactivitylog)|false|none|ActivityLog|none|
|»»» user_id|integer¦null|false|none||none|
|»»» event_type|string|false|none||none|
|»»» event_name|string|false|none||none|
|»»» description|string¦null|false|none||none|
|»»» data|object|false|none||none|
|»»» ip_address|string¦null|false|none||none|
|»»» user_agent|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»» *anonymous*|object|false|none||none|
|»»» id|integer|false|none||none|
|»»» updated_at|string(date-time)¦null|false|none||none|

## GET Get a list of activity logs

GET /api/activitylog

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|include|user|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "user_id": 0,
      "event_type": "string",
      "event_name": "string",
      "description": "string",
      "data": {},
      "ip_address": "string",
      "user_agent": "string",
      "id": 0,
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» ActivityLogResource|any|false|none|ActivityLogResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[ActivityLog](#schemaactivitylog)|false|none|ActivityLog|none|
|»»»» user_id|integer¦null|false|none||none|
|»»»» event_type|string|false|none||none|
|»»»» event_name|string|false|none||none|
|»»»» description|string¦null|false|none||none|
|»»»» data|object|false|none||none|
|»»»» ip_address|string¦null|false|none||none|
|»»»» user_agent|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

## POST Search for activity logs

POST /api/activitylog/search

> Body Parameters

```json
{
  "filters": [
    {
      "type": "and",
      "field": "user_id",
      "operator": "<",
      "value": "string",
      "nested": [
        {
          "type": "and",
          "field": "user_id",
          "operator": "<",
          "value": "string"
        }
      ]
    }
  ],
  "search": {
    "value": "string",
    "case_sensitive": true
  },
  "includes": [
    {
      "relation": "user",
      "filters": {
        "type": null,
        "items": {
          "type": "[",
          "field": "[",
          "operator": "[",
          "value": "string",
          "nested": [
            null
          ]
        }
      }
    }
  ]
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|include|query|string| no ||none|
|Accept|header|string| no ||none|
|body|body|object| no ||none|
|» filters|body|[object]| no ||none|
|»» type|body|string| no ||none|
|»» field|body|string| no ||none|
|»» operator|body|string| no ||none|
|»» value|body|string| no ||none|
|»» nested|body|[object]| no ||none|
|»»» type|body|string| no ||none|
|»»» field|body|string| no ||none|
|»»» operator|body|string| no ||none|
|»»» value|body|string| no ||none|
|» search|body|object| no ||none|
|»» value|body|string| no ||A search for the given value will be performed on the following fields: event_name, description, ip_address, user_agent|
|»» case_sensitive|body|boolean| no ||(default: true) Set it to false to perform search in case-insensitive way|
|» includes|body|[object]| no ||none|
|»» relation|body|string| no ||none|
|»» filters|body|object| no ||none|
|»»» type|body|any| no ||none|
|»»» items|body|object| no ||none|
|»»»» type|body|string| no ||none|
|»»»» field|body|string| no ||none|
|»»»» operator|body|string| no ||none|
|»»»» value|body|string| no ||none|
|»»»» nested|body|[object]| no ||none|
|»»»»» type|body|string| no ||none|
|»»»»» field|body|string| no ||none|
|»»»»» operator|body|string| no ||none|
|»»»»» value|body|string| no ||none|

#### Enum

|Name|Value|
|---|---|
|include|user|
|»» type|and|
|»» type|or|
|»» field|user_id|
|»» field|event_type|
|»» field|event_name|
|»» field|created_at|
|»» operator|<|
|»» operator|<=|
|»» operator|>|
|»» operator|>=|
|»» operator|=|
|»» operator|!=|
|»» operator|like|
|»» operator|not like|
|»» operator|ilike|
|»» operator|not ilike|
|»» operator|in|
|»» operator|not in|
|»» operator|all in|
|»» operator|any in|
|»»» type|and|
|»»» type|or|
|»»» field|user_id|
|»»» field|event_type|
|»»» field|event_name|
|»»» field|created_at|
|»»» operator|<|
|»»» operator|<=|
|»»» operator|>|
|»»» operator|>=|
|»»» operator|=|
|»»» operator|!=|
|»»» operator|like|
|»»» operator|not like|
|»»» operator|ilike|
|»»» operator|not ilike|
|»»» operator|in|
|»»» operator|not in|
|»»» operator|all in|
|»»» operator|any in|
|»» relation|user|
|»»»» type|and|
|»»»» type|or|
|»»»» field|user_id|
|»»»» field|event_type|
|»»»» field|event_name|
|»»»» field|created_at|
|»»»» operator|<|
|»»»» operator|<=|
|»»»» operator|>|
|»»»» operator|>=|
|»»»» operator|=|
|»»»» operator|!=|
|»»»» operator|like|
|»»»» operator|not like|
|»»»» operator|ilike|
|»»»» operator|not ilike|
|»»»» operator|in|
|»»»» operator|not in|
|»»»» operator|all in|
|»»»» operator|any in|
|»»»»» type|and|
|»»»»» type|or|
|»»»»» field|user_id|
|»»»»» field|event_type|
|»»»»» field|event_name|
|»»»»» field|created_at|
|»»»»» operator|<|
|»»»»» operator|<=|
|»»»»» operator|>|
|»»»»» operator|>=|
|»»»»» operator|=|
|»»»»» operator|!=|
|»»»»» operator|like|
|»»»»» operator|not like|
|»»»»» operator|ilike|
|»»»»» operator|not ilike|
|»»»»» operator|in|
|»»»»» operator|not in|
|»»»»» operator|all in|
|»»»»» operator|any in|

> Response Examples

> 200 Response

```json
{
  "data": [
    {
      "user_id": 0,
      "event_type": "string",
      "event_name": "string",
      "description": "string",
      "data": {},
      "ip_address": "string",
      "user_agent": "string",
      "id": 0,
      "updated_at": "2019-08-24T14:15:22Z"
    }
  ],
  "links": {
    "first": "http://example.com",
    "last": "http://example.com",
    "prev": "http://example.com",
    "next": "http://example.com"
  },
  "meta": {
    "current_page": 0,
    "from": 0,
    "last_page": 0,
    "path": "string",
    "per_page": 0,
    "to": 0,
    "total": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthenticated|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[allOf]|false|none||none|
|»» ActivityLogResource|any|false|none|ActivityLogResource|none|

*allOf*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|[ActivityLog](#schemaactivitylog)|false|none|ActivityLog|none|
|»»»» user_id|integer¦null|false|none||none|
|»»»» event_type|string|false|none||none|
|»»»» event_name|string|false|none||none|
|»»»» description|string¦null|false|none||none|
|»»»» data|object|false|none||none|
|»»»» ip_address|string¦null|false|none||none|
|»»»» user_agent|string¦null|false|none||none|

*and*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|»»» *anonymous*|object|false|none||none|
|»»»» id|integer|false|none||none|
|»»»» updated_at|string(date-time)¦null|false|none||none|

*continued*

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» links|[ResourceLinks](#schemaresourcelinks)|false|none|ResourceLinks|none|
|»» first|string(uri)|false|none||none|
|»» last|string(uri)|false|none||none|
|»» prev|string(uri)¦null|false|none||none|
|»» next|string(uri)¦null|false|none||none|
|» meta|[ResourceMeta](#schemaresourcemeta)|false|none|ResourceMeta|none|
|»» current_page|integer|false|none||none|
|»» from|integer|false|none||none|
|»» last_page|integer|false|none||none|
|»» path|string|false|none||none|
|»» per_page|integer|false|none||none|
|»» to|integer|false|none||none|
|»» total|integer|false|none||none|

# Roles

## GET List Roles

GET /api/roles

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|

### Responses Data Schema

# Machine Slot

## POST Create a vending machine slot

POST /api/machines/{machine}/slots

> Body Parameters

```json
{
  "mdb_code": 0,
  "label": "string",
  "product_id": 0,
  "capacity": 0,
  "current_stock": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||Vending machine id|
|Accept|header|string| no ||none|
|body|body|[VendingMachineSlotCreationResource](#schemavendingmachineslotcreationresource)| yes ||none|

> Response Examples

> 201 Response

```json
{
  "data": {
    "id": 0,
    "mdb_code": 0,
    "label": "string",
    "product_id": 0,
    "machine_id": 0,
    "capacity": 0,
    "current_stock": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **201**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[VendingMachineSlotResource](#schemavendingmachineslotresource)|true|none||none|
|»» id|integer|true|none||Identificador del slot en el backend|
|»» mdb_code|integer|true|none||Identificador local del producto|
|»» label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|»» product_id|integer¦null|false|none||Id del producto|
|»» machine_id|integer|true|none||Id de la máquina vending|
|»» capacity|integer¦null|false|none||Capacidad del slot|
|»» current_stock|integer¦null|false|none||Número de artículos en el slot|

## GET Get machine slots

GET /api/machines/{machine}/slots

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||Id de la máquina vending|
|Accept|header|string| no ||none|

> Response Examples

> 200 Response

```json
[
  {
    "id": 0,
    "mdb_code": 0,
    "label": "string",
    "product_id": 0,
    "machine_id": 0,
    "capacity": 0,
    "current_stock": 0
  }
]
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|*anonymous*|[[VendingMachineSlotResource](#schemavendingmachineslotresource)]|false|none||none|
|» id|integer|true|none||Identificador del slot en el backend|
|» mdb_code|integer|true|none||Identificador local del producto|
|» label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|» product_id|integer¦null|false|none||Id del producto|
|» machine_id|integer|true|none||Id de la máquina vending|
|» capacity|integer¦null|false|none||Capacidad del slot|
|» current_stock|integer¦null|false|none||Número de artículos en el slot|

## PATCH Update a vending machine slot

PATCH /api/machines/{machine}/slots/{slot}

> Body Parameters

```json
{
  "mdb_code": 0,
  "label": "string",
  "product_id": 0,
  "capacity": 0,
  "current_stock": 0
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||Identificador de la máquina vending|
|slot|path|integer| yes ||Identificador del slot|
|body|body|[VendingMachineSlotUpdateResource](#schemavendingmachineslotupdateresource)| yes ||none|

> Response Examples

> 200 Response

```json
{
  "data": {
    "id": 0,
    "mdb_code": 0,
    "label": "string",
    "product_id": 0,
    "machine_id": 0,
    "capacity": 0,
    "current_stock": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[VendingMachineSlotResource](#schemavendingmachineslotresource)|true|none||none|
|»» id|integer|true|none||Identificador del slot en el backend|
|»» mdb_code|integer|true|none||Identificador local del producto|
|»» label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|»» product_id|integer¦null|false|none||Id del producto|
|»» machine_id|integer|true|none||Id de la máquina vending|
|»» capacity|integer¦null|false|none||Capacidad del slot|
|»» current_stock|integer¦null|false|none||Número de artículos en el slot|

## DELETE Delete a vending machine slot

DELETE /api/machines/{machine}/slots/{slot}

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|machine|path|integer| yes ||Identificador de la máquina vending|
|slot|path|integer| yes ||Identificador del slot|

> Response Examples

> 200 Response

```json
{
  "data": {
    "id": 0,
    "mdb_code": 0,
    "label": "string",
    "product_id": 0,
    "machine_id": 0,
    "capacity": 0,
    "current_stock": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|none|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[VendingMachineSlotResource](#schemavendingmachineslotresource)|true|none||none|
|»» id|integer|true|none||Identificador del slot en el backend|
|»» mdb_code|integer|true|none||Identificador local del producto|
|»» label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|»» product_id|integer¦null|false|none||Id del producto|
|»» machine_id|integer|true|none||Id de la máquina vending|
|»» capacity|integer¦null|false|none||Capacidad del slot|
|»» current_stock|integer¦null|false|none||Número de artículos en el slot|

# Data Schema

<h2 id="tocS_VendingMachineSlotCreationResource">VendingMachineSlotCreationResource</h2>

<a id="schemavendingmachineslotcreationresource"></a>
<a id="schema_VendingMachineSlotCreationResource"></a>
<a id="tocSvendingmachineslotcreationresource"></a>
<a id="tocsvendingmachineslotcreationresource"></a>

```json
{
  "mdb_code": 0,
  "label": "string",
  "product_id": 0,
  "capacity": 0,
  "current_stock": 0
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|mdb_code|integer|true|none||Identificador local del producto|
|label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|product_id|integer¦null|false|none||Id del producto en el backend|
|capacity|integer¦null|false|none||Capacidad del slot|
|current_stock|integer¦null|false|none||Número de artículos en el slot|

<h2 id="tocS_VendingMachineSlotResource">VendingMachineSlotResource</h2>

<a id="schemavendingmachineslotresource"></a>
<a id="schema_VendingMachineSlotResource"></a>
<a id="tocSvendingmachineslotresource"></a>
<a id="tocsvendingmachineslotresource"></a>

```json
{
  "id": 0,
  "mdb_code": 0,
  "label": "string",
  "product_id": 0,
  "machine_id": 0,
  "capacity": 0,
  "current_stock": 0
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|id|integer|true|none||Identificador del slot en el backend|
|mdb_code|integer|true|none||Identificador local del producto|
|label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|product_id|integer¦null|false|none||Id del producto|
|machine_id|integer|true|none||Id de la máquina vending|
|capacity|integer¦null|false|none||Capacidad del slot|
|current_stock|integer¦null|false|none||Número de artículos en el slot|

<h2 id="tocS_VendingMachineSlotUpdateResource">VendingMachineSlotUpdateResource</h2>

<a id="schemavendingmachineslotupdateresource"></a>
<a id="schema_VendingMachineSlotUpdateResource"></a>
<a id="tocSvendingmachineslotupdateresource"></a>
<a id="tocsvendingmachineslotupdateresource"></a>

```json
{
  "mdb_code": 0,
  "label": "string",
  "product_id": 0,
  "capacity": 0,
  "current_stock": 0
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|mdb_code|integer|true|none||Identificador local del producto|
|label|string|false|none||Etiqueta del slot, toma el valor de mdb_code por defecto|
|product_id|integer¦null|false|none||Id del producto en el backend|
|capacity|integer¦null|false|none||Capacidad del slot|
|current_stock|integer¦null|false|none||Número de artículos en el slot|

<h2 id="tocS_ForgotPasswordResource">ForgotPasswordResource</h2>

<a id="schemaforgotpasswordresource"></a>
<a id="schema_ForgotPasswordResource"></a>
<a id="tocSforgotpasswordresource"></a>
<a id="tocsforgotpasswordresource"></a>

```json
{
  "email": "customer@email.com"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|email|string(email)|true|none||User email|

<h2 id="tocS_RestorePasswordResource">RestorePasswordResource</h2>

<a id="schemarestorepasswordresource"></a>
<a id="schema_RestorePasswordResource"></a>
<a id="tocSrestorepasswordresource"></a>
<a id="tocsrestorepasswordresource"></a>

```json
{
  "email": "customer@email.com",
  "password": "pa$$word",
  "token": "pa$$word"
}

```

RestorePasswordResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|email|string(email)|true|none||User email|
|password|string(password)|true|none||User new password|
|token|string(password)|true|none||Password restoration token|

<h2 id="tocS_VendingMachineCreation">VendingMachineCreation</h2>

<a id="schemavendingmachinecreation"></a>
<a id="schema_VendingMachineCreation"></a>
<a id="tocSvendingmachinecreation"></a>
<a id="tocsvendingmachinecreation"></a>

```json
{
  "name": "string",
  "location": "string",
  "client_id": "string",
  "type": "MDB ",
  "enterprise_id": 0,
  "mqtt_user": {
    "username": "string",
    "password": "string"
  }
}

```

VendingMachineCreation

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|location|string¦null|false|none||none|
|client_id|string|false|none||none|
|type|string¦null|false|none||none|
|enterprise_id|integer¦null|false|none||none|
|mqtt_user|object|true|none||MQTT Credentials|
|» username|string|true|none||MQTT Username|
|» password|string|true|none||MQTT Password|

<h2 id="tocS_VendingMachineUpdate">VendingMachineUpdate</h2>

<a id="schemavendingmachineupdate"></a>
<a id="schema_VendingMachineUpdate"></a>
<a id="tocSvendingmachineupdate"></a>
<a id="tocsvendingmachineupdate"></a>

```json
{
  "name": "string",
  "location": "string",
  "client_id": "string",
  "type": "MDB ",
  "enterprise_id": 0,
  "mqtt_user": {
    "username": "string",
    "password": "string"
  }
}

```

VendingMachineUpdate

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|location|string¦null|false|none||none|
|client_id|string|false|none||none|
|type|string¦null|false|none||none|
|enterprise_id|integer¦null|false|none||none|
|mqtt_user|object|true|none||MQTT Credentials|
|» username|string|true|none||MQTT Username|
|» password|string|true|none||MQTT Password|

<h2 id="tocS_UserCreationResource">UserCreationResource</h2>

<a id="schemausercreationresource"></a>
<a id="schema_UserCreationResource"></a>
<a id="tocSusercreationresource"></a>
<a id="tocsusercreationresource"></a>

```json
{
  "name": "string",
  "email": "string",
  "rut": "DONOTMODIFY",
  "password": "8uD26yCtqms2",
  "password_confirmation": "8uD26yCtqms2",
  "role": "string"
}

```

### Attribute

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[User](#schemauser)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» password|string|true|none||none|
|» password_confirmation|string|true|none||none|
|» role|string|true|none||none|

<h2 id="tocS_EnterpriseCreationResource">EnterpriseCreationResource</h2>

<a id="schemaenterprisecreationresource"></a>
<a id="schema_EnterpriseCreationResource"></a>
<a id="tocSenterprisecreationresource"></a>
<a id="tocsenterprisecreationresource"></a>

```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "rut": "string",
  "user_id": 0
}

```

Enterprise Copy

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|Enterprise Copy|any|false|none|Enterprise Copy|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[Enterprise](#schemaenterprise)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|

<h2 id="tocS_User">User</h2>

<a id="schemauser"></a>
<a id="schema_User"></a>
<a id="tocSuser"></a>
<a id="tocsuser"></a>

```json
{
  "name": "string",
  "email": "string",
  "rut": "DONOTMODIFY"
}

```

User

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|email|string|false|none||none|
|rut|string|false|none||none|

<h2 id="tocS_UserResource">UserResource</h2>

<a id="schemauserresource"></a>
<a id="schema_UserResource"></a>
<a id="tocSuserresource"></a>
<a id="tocsuserresource"></a>

```json
{
  "name": "string",
  "email": "string",
  "rut": "DONOTMODIFY",
  "id": 0,
  "email_verified_at": "string",
  "remember_token": "string",
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

UserResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|UserResource|any|false|none|UserResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[User](#schemauser)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» email_verified_at|string¦null|false|none||none|
|» remember_token|string¦null|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_Enterprise">Enterprise</h2>

<a id="schemaenterprise"></a>
<a id="schema_Enterprise"></a>
<a id="tocSenterprise"></a>
<a id="tocsenterprise"></a>

```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "rut": "string",
  "user_id": 0
}

```

Enterprise

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|true|none||none|
|address|string¦null|false|none||none|
|phone|string¦null|false|none||none|
|rut|string|true|none||none|
|user_id|integer¦null|false|none||none|

<h2 id="tocS_EnterpriseResource">EnterpriseResource</h2>

<a id="schemaenterpriseresource"></a>
<a id="schema_EnterpriseResource"></a>
<a id="tocSenterpriseresource"></a>
<a id="tocsenterpriseresource"></a>

```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "rut": "string",
  "user_id": 0,
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

EnterpriseResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|EnterpriseResource|any|false|none|EnterpriseResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[Enterprise](#schemaenterprise)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_VendingMachine">VendingMachine</h2>

<a id="schemavendingmachine"></a>
<a id="schema_VendingMachine"></a>
<a id="tocSvendingmachine"></a>
<a id="tocsvendingmachine"></a>

```json
{
  "name": "string",
  "status": "Inactive",
  "is_enabled": true,
  "location": "string",
  "client_id": "string",
  "type": "MDB ",
  "enterprise_id": 0,
  "mqtt_username": "string",
  "mqtt_password": "string"
}

```

VendingMachine

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|status|string|false|none||none|
|is_enabled|boolean|false|none||none|
|location|string¦null|false|none||none|
|client_id|string|false|none||none|
|type|string¦null|false|none||none|
|enterprise_id|integer¦null|false|none||none|
|mqtt_username|string¦null|false|none||none|
|mqtt_password|string¦null|false|none||none|

#### Enum

|Name|Value|
|---|---|
|status|Inactive|
|status|Active|
|status|Maintenance|
|status|OutOfService|

<h2 id="tocS_VendingMachineResource">VendingMachineResource</h2>

<a id="schemavendingmachineresource"></a>
<a id="schema_VendingMachineResource"></a>
<a id="tocSvendingmachineresource"></a>
<a id="tocsvendingmachineresource"></a>

```json
{
  "name": "string",
  "status": "Inactive",
  "is_enabled": true,
  "location": "string",
  "client_id": "string",
  "type": "MDB ",
  "enterprise_id": 0,
  "mqtt_username": "string",
  "mqtt_password": "string",
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

VendingMachineResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|VendingMachineResource|any|false|none|VendingMachineResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[VendingMachine](#schemavendingmachine)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_Product">Product</h2>

<a id="schemaproduct"></a>
<a id="schema_Product"></a>
<a id="tocSproduct"></a>
<a id="tocsproduct"></a>

```json
{
  "name": "string",
  "enterprise_id": 0
}

```

Product

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|enterprise_id|integer¦null|false|none||none|

<h2 id="tocS_ProductResource">ProductResource</h2>

<a id="schemaproductresource"></a>
<a id="schema_ProductResource"></a>
<a id="tocSproductresource"></a>
<a id="tocsproductresource"></a>

```json
{
  "name": "string",
  "enterprise_id": 0,
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

ProductResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|ProductResource|any|false|none|ProductResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[Product](#schemaproduct)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_VendingMachineCell">VendingMachineCell</h2>

<a id="schemavendingmachinecell"></a>
<a id="schema_VendingMachineCell"></a>
<a id="tocSvendingmachinecell"></a>
<a id="tocsvendingmachinecell"></a>

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "cell": 0,
  "product_stock": 0
}

```

VendingMachineCell

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|vending_machine_id|integer|false|none||none|
|product_id|integer¦null|false|none||none|
|cell|integer|false|none||none|
|product_stock|integer¦null|false|none||none|

<h2 id="tocS_VendingMachineCellResource">VendingMachineCellResource</h2>

<a id="schemavendingmachinecellresource"></a>
<a id="schema_VendingMachineCellResource"></a>
<a id="tocSvendingmachinecellresource"></a>
<a id="tocsvendingmachinecellresource"></a>

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "cell": 0,
  "product_stock": 0,
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

VendingMachineCellResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|VendingMachineCellResource|any|false|none|VendingMachineCellResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[VendingMachineCell](#schemavendingmachinecell)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_VendingMachineChannel">VendingMachineChannel</h2>

<a id="schemavendingmachinechannel"></a>
<a id="schema_VendingMachineChannel"></a>
<a id="tocSvendingmachinechannel"></a>
<a id="tocsvendingmachinechannel"></a>

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "product_stock": 0,
  "pulses": 0,
  "unit": "string",
  "quantity": 0
}

```

VendingMachineChannel

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|vending_machine_id|integer|false|none||none|
|product_id|integer¦null|false|none||none|
|product_stock|integer¦null|false|none||none|
|pulses|integer|false|none||none|
|unit|string|false|none||none|
|quantity|integer|false|none||none|

<h2 id="tocS_VendingMachineChannelResource">VendingMachineChannelResource</h2>

<a id="schemavendingmachinechannelresource"></a>
<a id="schema_VendingMachineChannelResource"></a>
<a id="tocSvendingmachinechannelresource"></a>
<a id="tocsvendingmachinechannelresource"></a>

```json
{
  "vending_machine_id": 0,
  "product_id": 0,
  "product_stock": 0,
  "pulses": 0,
  "unit": "string",
  "quantity": 0,
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

VendingMachineChannelResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|VendingMachineChannelResource|any|false|none|VendingMachineChannelResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[VendingMachineChannel](#schemavendingmachinechannel)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_Payment">Payment</h2>

<a id="schemapayment"></a>
<a id="schema_Payment"></a>
<a id="tocSpayment"></a>
<a id="tocspayment"></a>

```json
{
  "successful": true,
  "amount": 0,
  "date": "string",
  "product": "string",
  "response_code": 0,
  "response_message": "string",
  "commerce_code": "string",
  "terminal_id": "string",
  "authorization_code": 0,
  "last_digits": "string",
  "operation_number": "string",
  "card_type": "string",
  "card_brand": "string",
  "share_type": "string",
  "shares_number": 0,
  "shares_amount": 0,
  "machine_id": 0,
  "enterprise_id": 0
}

```

Payment

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|successful|boolean¦null|false|none||none|
|amount|integer¦null|false|none||none|
|date|string¦null|false|none||none|
|product|string¦null|false|none||none|
|response_code|integer¦null|false|none||none|
|response_message|string¦null|false|none||none|
|commerce_code|string¦null|false|none||none|
|terminal_id|string¦null|false|none||none|
|authorization_code|integer¦null|false|none||none|
|last_digits|string¦null|false|none||none|
|operation_number|string¦null|false|none||none|
|card_type|string¦null|false|none||none|
|card_brand|string¦null|false|none||none|
|share_type|string¦null|false|none||none|
|shares_number|integer¦null|false|none||none|
|shares_amount|integer¦null|false|none||none|
|machine_id|integer¦null|false|none||none|
|enterprise_id|integer¦null|false|none||none|

<h2 id="tocS_PaymentResource">PaymentResource</h2>

<a id="schemapaymentresource"></a>
<a id="schema_PaymentResource"></a>
<a id="tocSpaymentresource"></a>
<a id="tocspaymentresource"></a>

```json
{
  "successful": true,
  "amount": 0,
  "date": "string",
  "product": "string",
  "response_code": 0,
  "response_message": "string",
  "commerce_code": "string",
  "terminal_id": "string",
  "authorization_code": 0,
  "last_digits": "string",
  "operation_number": "string",
  "card_type": "string",
  "card_brand": "string",
  "share_type": "string",
  "shares_number": 0,
  "shares_amount": 0,
  "machine_id": 0,
  "enterprise_id": 0,
  "id": 0,
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z"
}

```

PaymentResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|PaymentResource|any|false|none|PaymentResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[Payment](#schemapayment)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» created_at|string(date-time)¦null|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

<h2 id="tocS_ResourceLinks">ResourceLinks</h2>

<a id="schemaresourcelinks"></a>
<a id="schema_ResourceLinks"></a>
<a id="tocSresourcelinks"></a>
<a id="tocsresourcelinks"></a>

```json
{
  "first": "http://example.com",
  "last": "http://example.com",
  "prev": "http://example.com",
  "next": "http://example.com"
}

```

ResourceLinks

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|first|string(uri)|false|none||none|
|last|string(uri)|false|none||none|
|prev|string(uri)¦null|false|none||none|
|next|string(uri)¦null|false|none||none|

<h2 id="tocS_ResourceMeta">ResourceMeta</h2>

<a id="schemaresourcemeta"></a>
<a id="schema_ResourceMeta"></a>
<a id="tocSresourcemeta"></a>
<a id="tocsresourcemeta"></a>

```json
{
  "current_page": 0,
  "from": 0,
  "last_page": 0,
  "path": "string",
  "per_page": 0,
  "to": 0,
  "total": 0
}

```

ResourceMeta

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|current_page|integer|false|none||none|
|from|integer|false|none||none|
|last_page|integer|false|none||none|
|path|string|false|none||none|
|per_page|integer|false|none||none|
|to|integer|false|none||none|
|total|integer|false|none||none|

<h2 id="tocS_ActivityLog">ActivityLog</h2>

<a id="schemaactivitylog"></a>
<a id="schema_ActivityLog"></a>
<a id="tocSactivitylog"></a>
<a id="tocsactivitylog"></a>

```json
{
  "user_id": 0,
  "event_type": "string",
  "event_name": "string",
  "description": "string",
  "data": {},
  "ip_address": "string",
  "user_agent": "string"
}

```

ActivityLog

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|user_id|integer¦null|false|none||none|
|event_type|string|false|none||none|
|event_name|string|false|none||none|
|description|string¦null|false|none||none|
|data|object|false|none||none|
|ip_address|string¦null|false|none||none|
|user_agent|string¦null|false|none||none|

<h2 id="tocS_ActivityLogResource">ActivityLogResource</h2>

<a id="schemaactivitylogresource"></a>
<a id="schema_ActivityLogResource"></a>
<a id="tocSactivitylogresource"></a>
<a id="tocsactivitylogresource"></a>

```json
{
  "user_id": 0,
  "event_type": "string",
  "event_name": "string",
  "description": "string",
  "data": {},
  "ip_address": "string",
  "user_agent": "string",
  "id": 0,
  "updated_at": "2019-08-24T14:15:22Z"
}

```

ActivityLogResource

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|ActivityLogResource|any|false|none|ActivityLogResource|none|

allOf

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|[ActivityLog](#schemaactivitylog)|false|none||none|

and

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||none|
|» id|integer|false|none||none|
|» updated_at|string(date-time)¦null|false|none||none|

