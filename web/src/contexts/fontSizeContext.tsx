import { createContext, useState } from 'react';

export const FontSizeContext = createContext({ fontSize: 22, setFontSize: (_size: number) => {} });

export const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSize] = useState(22);
  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}; 