import { describe, expect, it } from 'vitest'
import { generateController } from './code-generator'

describe('code generator', () => {
  it('generates Nova 2.0 controller handlers', () => {
    const output = generateController('planet', 'planets')

    expect(output).toContain("import { Controller, Handle, Public } from '@outscope/nova'")
    expect(output).toContain('@Handle(planet.list)')
    expect(output).not.toContain('@Implement')
    expect(output).not.toContain('@Implementer')
  })
})
