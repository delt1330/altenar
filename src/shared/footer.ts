import {byName as $} from './dom';
import './footer.css';

// Navigation and compliance content come from the page's footer slot.
export function mountFooter(footer: HTMLElement, assetRoot='/premium-media/footer-logos/'){
  if(footer.hasAttribute('data-shared-footer'))return;
  footer.setAttribute('data-shared-footer','');
  footer.classList.add('premium-footer');
  const slot=document.createElement('div');slot.className='premium-footer-underlay';footer.before(slot);slot.append(footer);
  const transition=document.createElement('div'); transition.className='premium-footer-transition'; transition.setAttribute('aria-hidden','true'); slot.prepend(transition);
  const logoNames=['IBIA','AGCO','Malta Gaming Authority','ISO 27001','Gambling Commission','ONJN','Hellenic Gaming Commission','Spelinspektionen','Spillemyndigheden','Western Cape Gambling and Racing Board','Peru Ministerio de Comercio Exterior y Turismo'];
  const logoFiles=['logo.png','logo-1.png','Mask Container.png','logo-2.png','Mask Container-1.png','logo-3.png','logo-4.png','logo-5.png','logo-6.png','logo-7.png','logo-8.png'];
  const dimensions=[[141,60],[311,60],[305,60],[60,60],[225,60],[63,60],[121,60],[85,60],[60,60],[229,60],[283,60]];
  const row=$('footer__logos-row',footer)!;row.replaceChildren(...logoFiles.map((file,i)=>{const img=document.createElement('img');img.src=assetRoot+file;img.alt=logoNames[i];img.width=dimensions[i][0]/2;img.height=30;img.style.width=`${dimensions[i][0]/2}px`;img.style.height='30px';return img;}));
  const legal = $('footer__compliance',footer)?.querySelector<HTMLElement>(':scope > p');
  if (legal) {
    legal.textContent = (legal.textContent || '').replace(/\s+(?=Under no circumstances|Altenar is licensed and regulated by the Malta Gaming Authority|The following entity holds a Type2 B2B licence|Altenar is licensed and regulated by the Romanian National Office|Altenar Technologies Limited is licensed and regulated in Great Britain|The following entity holds a combined remote operating license)/g, '\n\n');
  }
  const background=document.createElement('div');background.className='premium-footer-background';background.setAttribute('aria-hidden','true');
  footer.prepend(background);
  const brand = document.createElement('a'); brand.className='premium-footer-brand'; brand.href=import.meta.env.BASE_URL; brand.setAttribute('aria-label','Altenar Home');
  const logo=document.createElement('img'); logo.src='/premium-media/logo-on-dark.svg'; logo.alt='Altenar'; brand.append(logo); footer.append(brand);
}
