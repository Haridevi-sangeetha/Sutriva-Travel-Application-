
import React from 'react';
import { ACTIVITIES_HTML } from '../content/sections';

export default function ActivitiesPage() {
  return <div dangerouslySetInnerHTML={{ __html: ACTIVITIES_HTML }} />;
}
