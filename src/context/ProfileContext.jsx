'use client';
import { createContext, useContext } from 'react';

/** openEmployee(id) / openOutlet(id) open the 360° profile modals from anywhere in the app. */
export const ProfileContext = createContext({ openEmployee: () => {}, openOutlet: () => {} });
export const useProfiles = () => useContext(ProfileContext);