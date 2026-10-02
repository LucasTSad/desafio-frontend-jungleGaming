import { expect, test } from '@playwright/test'
import {
  addEth,
  compareEth,
  fromWei,
  multiplyEth,
  percentOfEth,
  subtractEth,
  toWei,
} from '@/lib/eth'

test.describe('valores em ETH', () => {
  test('converte entre string decimal e wei sem perder precisão', () => {
    expect(toWei('1')).toBe(10n ** 18n)
    expect(toWei('0.000000000000000001')).toBe(1n)
    expect(fromWei(toWei('12.3'))).toBe('12.3')
    expect(fromWei(toWei('0.016'))).toBe('0.016')
    expect(fromWei(0n)).toBe('0')
  })

  test('soma sem o erro de ponto flutuante', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(addEth('2.38', '8.34', '16.11', '0.016')).toBe('26.846')
  })

  test('multiplica por quantidade inteira e recusa fração', () => {
    expect(multiplyEth('1.19', 2)).toBe('2.38')
    expect(multiplyEth('1.39', 6)).toBe('8.34')
    expect(() => multiplyEth('1', 1.5)).toThrow()
  })

  test('aplica percentual em pontos-base e subtrai', () => {
    expect(percentOfEth('26.83', 1000)).toBe('2.683')
    expect(subtractEth('26.83', '2.683')).toBe('24.147')
    expect(percentOfEth('0.000000000000000001', 1000)).toBe('0')
  })

  test('compara valores', () => {
    expect(compareEth('1.19', '1.190')).toBe(0)
    expect(compareEth('1.2', '1.19')).toBe(1)
    expect(compareEth('0.99', '1')).toBe(-1)
  })

  test('recusa formatos inválidos', () => {
    for (const value of ['', '1.', '.5', '-1', '1e3', '1,5', '0.1234567890123456789']) {
      expect(() => toWei(value), value).toThrow()
    }
  })
})
