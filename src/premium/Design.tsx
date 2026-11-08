import {setupGlow} from './glow/setup';
import React,{useLayoutEffect} from 'react';
import OriginalDesign from '../Design';
import {adaptDesign} from './design';
import {setupPremiumMotion} from './motion';

// The approved component tree stays the source of interactive content.
// This route's child layout effect runs before the existing page controllers.
export default function PremiumDesign(){
  useLayoutEffect(()=>{adaptDesign();const disposeMotion=setupPremiumMotion(),disposeGlow=setupGlow();return()=>{disposeGlow();disposeMotion();};},[]);
  return <OriginalDesign/>;
}
