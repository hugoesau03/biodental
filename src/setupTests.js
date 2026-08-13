// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// El jsdom que trae react-scripts 5 (Jest 27) no expone TextEncoder /
// TextDecoder de forma global, y react-router-dom v7 los necesita al
// importarse. Sin este polyfill, cualquier test que importe
// react-router-dom falla con "TextEncoder is not defined" antes de llegar
// a correr un solo test.
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
