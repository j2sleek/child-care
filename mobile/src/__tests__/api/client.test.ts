import axios from 'axios';
import { useAuthStore } from '../../stores/auth.store';

// We test the interceptor behaviour by inspecting the axios instance
jest.mock('axios', () => {
  const instance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  return {
    ...jest.requireActual('axios'),
    create: jest.fn(() => instance),
    post: jest.fn(),
  };
});

describe('apiClient', () => {
  it('creates an axios instance with correct base URL', () => {
    // Reimport fresh to trigger module-level code
    jest.resetModules();
    const { apiClient } = require('../../api/client');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.stringContaining('/v1'),
        timeout: 15000,
      })
    );
  });

  it('registers request and response interceptors', () => {
    jest.resetModules();
    const { apiClient } = require('../../api/client');
    expect(apiClient.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(apiClient.interceptors.response.use).toHaveBeenCalledTimes(1);
  });
});
