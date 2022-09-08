import { PluginRegistry } from 'tdp_core';
import reg from './phovea';

// other modules
import 'tdp_core/dist/phovea_registry';
// self
PluginRegistry.getInstance().register('demo', reg);
