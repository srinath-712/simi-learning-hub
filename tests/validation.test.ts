import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAuthInput, validateContentInput, validateRole, validateSubjectInput } from '../src/lib/validation.ts'
test('validates auth input', () => { assert.equal(validateAuthInput('person@example.com', 'strong-password'), null); assert.notEqual(validateAuthInput('bad-email', 'short'), null) })
test('validates subjects and URLs', () => { assert.equal(validateSubjectInput('Physics', ''), null); assert.notEqual(validateSubjectInput('', ''), null); assert.equal(validateContentInput('youtube', 'Lesson', '', 'https://youtu.be/abc1234'), null); assert.notEqual(validateContentInput('youtube', 'Lesson', '', 'https://example.com'), null) })
test('validates roles', () => { assert.equal(validateRole('head'), true); assert.equal(validateRole('owner'), false) })
