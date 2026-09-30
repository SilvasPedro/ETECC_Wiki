import { Article, ArticleCategory } from '../types/wiki';

export const DEFAULT_CATEGORIES: ArticleCategory[] = [
  {
    id: 'geral',
    name: 'Geral & Cultura',
    iconName: 'Building2',
    description: 'História, valores, boas-vindas e regras institucionais da ETECC.',
  },
  {
    id: 'ti-seguranca',
    name: 'TI & Segurança',
    iconName: 'ShieldAlert',
    description: 'Acesso a sistemas, VPN, políticas de dados e infraestrutura corporativa.',
  },
  {
    id: 'design-marca',
    name: 'Design & Marca (#e4022c)',
    iconName: 'Palette',
    description: 'Diretrizes visuais da ETECC, paleta de cores e padrões de design.',
  },
  {
    id: 'engenharia',
    name: 'Engenharia & DevOps',
    iconName: 'Code2',
    description: 'Padrões de arquitetura, esteiras CI/CD, repositórios e documentação técnica.',
  },
  {
    id: 'rh-pessoas',
    name: 'RH & Benefícios',
    iconName: 'Users',
    description: 'Políticas internas, benefícios, feedbacks e rotinas de departamento pessoal.',
  },
  {
    id: 'operacoes',
    name: 'Operações & POPs',
    iconName: 'CheckSquare',
    description: 'Procedimentos operacionais padrão, checklists e manuais de processos.',
  },
];

// No mock articles - only authentic articles from Firestore are loaded
export const INITIAL_ARTICLES: Article[] = [];
