
import React from 'react';
import { FOOD_HTML } from '../content/sections';

export default function FoodPage() {
  return <div dangerouslySetInnerHTML={{ __html: FOOD_HTML }} />;
}
