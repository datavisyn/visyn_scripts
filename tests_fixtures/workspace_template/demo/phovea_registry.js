import {PluginRegistry} from 'tdp_core/dist/app';
import reg from './dist/phovea';

// other modules
import 'tdp_core/phovea_registry';
// self
PluginRegistry.getInstance().register('demo', reg);
