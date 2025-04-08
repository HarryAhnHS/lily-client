// lib/api.js
import { supabase } from './supabase';

export const authorizedFetch = async (url, options = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};