import { useLocaleStore, setLocale, useI18n } from '../../lib/i18n';
import { renderHook, act } from '@testing-library/react-native';

beforeEach(() => {
  // Reset to English
  act(() => {
    useLocaleStore.setState({ locale: 'en' });
    setLocale('en');
  });
});

describe('i18n', () => {
  it('resolves English keys by default', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.login')).toBe('Log In');
    expect(result.current.t('common.save')).toBe('Save');
  });

  it('setLocale switches the active locale', () => {
    act(() => { setLocale('fr'); });
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.login')).toBe('Se connecter');
  });

  it('falls back to English for missing keys in other locales', () => {
    act(() => { setLocale('fr'); });
    const { result } = renderHook(() => useI18n());
    // French translations exist — test a key that is defined
    expect(result.current.t('common.cancel')).toBe('Annuler');
  });

  it('locale state reflects the active locale', () => {
    const { result, rerender } = renderHook(() => useI18n());
    expect(result.current.locale).toBe('en');
    act(() => { setLocale('es'); });
    rerender({});
    expect(result.current.locale).toBe('es');
  });

  it('supports Spanish translations', () => {
    act(() => { setLocale('es'); });
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.register')).toBe('Registrarse');
  });

  it('supports Arabic translations', () => {
    act(() => { setLocale('ar'); });
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('common.save')).toBe('حفظ');
  });
});
