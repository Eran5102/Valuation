import swaggerJsdoc from 'swagger-jsdoc'
import { swaggerOptions } from './config'

let swaggerSpec: any = null

export function getSwaggerSpec() {
  if (!swaggerSpec) {
    swaggerSpec = swaggerJsdoc(swaggerOptions)
  }
  return swaggerSpec
}

export default getSwaggerSpec
