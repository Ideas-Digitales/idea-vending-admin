export interface MockProduct {
  id: number;
  name: string;
  color: string;
}

export interface MachineTemplate {
  id: string;
  name: string;
  brand: string;
  description: string;
  columns: number;
  rows: number;
  tags: string[];
  popular?: boolean;
  category: 'snack' | 'beverage' | 'combo' | 'compact';
}

export const MOCK_PRODUCTS: MockProduct[] = [
  { id: 1,  name: 'Coca Cola 350ml',     color: '#ef4444' },
  { id: 2,  name: 'Pepsi 355ml',         color: '#2563eb' },
  { id: 3,  name: 'Agua Mineral 500ml',  color: '#38bdf8' },
  { id: 4,  name: "Lay's Original",      color: '#facc15' },
  { id: 5,  name: 'Doritos Queso',       color: '#f97316' },
  { id: 6,  name: 'KitKat',             color: '#92400e' },
  { id: 7,  name: "Jugo Watt's 250ml",  color: '#fb923c' },
  { id: 8,  name: 'Galletas Oreo',      color: '#374151' },
  { id: 9,  name: 'Monster Energy',     color: '#16a34a' },
  { id: 10, name: 'Pringles Original',  color: '#dc2626' },
  { id: 11, name: 'Yogurt Soprole',     color: '#ec4899' },
  { id: 12, name: 'Barra KIND',         color: '#d97706' },
];

export const MACHINE_TEMPLATES: MachineTemplate[] = [
  {
    id: 'crane-167',
    name: 'Crane National 167',
    brand: 'Crane',
    description: 'La máquina de snacks más popular en Chile y Latinoamérica. Distribución uniforme en 5 columnas.',
    columns: 5,
    rows: 7,
    tags: ['Snack'],
    popular: true,
    category: 'snack',
  },
  {
    id: 'jofemar-vision',
    name: 'Jofemar Vision ES Plus',
    brand: 'Jofemar',
    description: 'Máquina de alta capacidad con 6 columnas. Ideal para ubicaciones de alto tráfico.',
    columns: 6,
    rows: 8,
    tags: ['Snack', 'Alta cap.'],
    popular: true,
    category: 'snack',
  },
  {
    id: 'bianchi-rondo',
    name: 'Bianchi Rondo',
    brand: 'Bianchi',
    description: 'Diseño compacto de 4 columnas, ideal para espacios reducidos con buena variedad.',
    columns: 4,
    rows: 6,
    tags: ['Compacta', 'Snack'],
    category: 'compact',
  },
  {
    id: 'sielaff-f3',
    name: 'Sielaff F3',
    brand: 'Sielaff',
    description: 'Máquina estándar de 5 columnas con 6 filas. Versatilidad para snacks y bebidas frías.',
    columns: 5,
    rows: 6,
    tags: ['Combo', 'Snack'],
    category: 'combo',
  },
  {
    id: 'ivs-slim',
    name: 'IVS Slim 3.0',
    brand: 'IVS Group',
    description: 'Formato angosto con 3 columnas. Perfecta para pasillos y espacios muy limitados.',
    columns: 3,
    rows: 5,
    tags: ['Compacta', 'Mini'],
    category: 'compact',
  },
  {
    id: 'nw-g-snack',
    name: 'N&W G-Snack Plus',
    brand: 'N&W Global',
    description: 'Combo de snacks y bebidas. 4 columnas con mayor profundidad por fila.',
    columns: 4,
    rows: 8,
    tags: ['Combo', 'Bebidas'],
    category: 'beverage',
  },
];
