import { developmentConfig } from './development'
import { productionConfig } from './production'

const isDevelopment = process.env.NODE_ENV === 'development'

export const config = isDevelopment ? developmentConfig : productionConfig 