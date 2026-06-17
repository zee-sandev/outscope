import { describe, expect, it } from 'vitest'
import { generateController, generateRoutes } from './code-generator'

describe('code generator', () => {
  it('generates Nova 2.0 controller handlers', () => {
    const output = generateController('planet', 'planets')

    expect(output).toContain("import { Controller, Handle, Public } from '@outscope/nova'")
    expect(output).toContain("import { planetRoutes } from '@routes/planets'")
    expect(output).toContain('@Handle(planetRoutes.list)')
    expect(output).not.toContain('@contracts')
    expect(output).not.toContain('@Handle(planet.list)')
    expect(output).not.toContain('@Implement')
    expect(output).not.toContain('@Implementer')
  })

  it('generates Nova 2.0 route bundles', () => {
    const output = generateRoutes('planet')

    expect(output).toContain('export const planetRoutes = {')
    expect(output).toContain('// TODO: Add more route methods')
    expect(output).not.toContain('export const planet = {')
    expect(output).not.toContain('contract methods')
  })
})
