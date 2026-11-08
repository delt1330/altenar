import {turnkeyProductUrl} from '../../shared/routes';

export function connectTurnkeySolution(){
  const cta=document.querySelector<HTMLElement>('#solution-panel-0 .premium-solution-cta');
  if(!cta)return;
  const link=document.createElement('a');
  Array.from(cta.attributes).forEach(attribute=>link.setAttribute(attribute.name,attribute.value));
  link.href=turnkeyProductUrl;
  delete link.dataset.solutionLinkMissing;
  link.removeAttribute('role');link.removeAttribute('aria-disabled');link.removeAttribute('aria-description');
  while(cta.firstChild)link.append(cta.firstChild);
  cta.replaceWith(link);
}
