
import React from 'react';
import { TOOLS_HTML } from '../content/sections';

export default function ToolsSuite() {
  return <div dangerouslySetInnerHTML={{ __html: TOOLS_HTML }} />;
}
