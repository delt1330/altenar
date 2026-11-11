import '../main';
import './theme.css';

import './glow/theme.css';

import '../shared/typography.css';
import '../shared/navigation.css';
import '../shared/controls.css';
import {mountMonoType} from '../shared/mono-type';
import {mountCornerSmoothing} from '../shared/corner-smoothing';
import {mountReview} from '../review';

mountMonoType();mountCornerSmoothing();mountReview();
