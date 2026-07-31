import React from 'react';
import { useOutletContext } from 'react-router-dom';

export function useAppShellContext() {
 return useOutletContext<any>();
}
