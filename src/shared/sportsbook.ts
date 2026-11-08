import {mountFooter} from './footer';
import {createContactSection} from './contact';
import {createFaqItem} from './faq';
import {mountSplitButtons} from './split-button';
import './controls.css';
import {mountNavigation} from './navigation';
import './navigation.css';
import './typography.css';

window.AltenarUI = {mountNavigation,mountSplitButtons,createFaqItem,createContactSection,mountFooter};

// Load the portable export after shared component APIs are registered.
const turnkey = document.createElement('script');
turnkey.type = 'module';
turnkey.src = '/_turnkey/assets/turnkey-contained-art-20261104.js';
document.head.append(turnkey);
