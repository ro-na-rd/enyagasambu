const pool = require('../config/db');

/**
 * Check if a broker has a specific permission for a module and action.
 * Follows the same pattern as checkExecutivePermission in auth.js.
 * 
 * @param {import('express').Request} req - Express request object (req.user must be set by authenticate middleware)
 * @param {import('express').Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} module - The module to check (e.g., 'products', 'properties', 'vehicles')
 * @param {string} action - The action to check (e.g., 'view', 'create', 'edit', 'delete', 'approve', 'export')
 * @returns {Promise<void>}
 */
const checkBrokerPermission = async (req, res, next, module, action) => {
  try {
    const [rows] = await pool.query(
      'SELECT 1 FROM broker_permissions WHERE role = ? AND module = ? AND action = ? AND is_active = 1',
      ['broker', module, action]
    );
    
    if (rows.length === 0) {
      return res.status(403).json({ message: Broker permission denied:  -  });
    }
    
    next();
  } catch (error) {
    console.error('Error checking broker permission:', error);
    return res.status(500).json({ message: 'Internal server error while checking permissions' });
  }
};

/**
 * Higher-order middleware: requireBrokerRole
 * Checks if the broker has permissions for specific modules and/or actions.
 * 
 * @param {Object} options - Configuration object
 * @param {string[]} options.modules - Array of module names required (e.g., ['products', 'clients'])
 * @param {string[]} [options.actions] - Array of actions required (e.g., ['view', 'create'])
 * @returns {Function} Express middleware function
 */
const requireBrokerRole = (options = {}) => {
  const { modules, actions } = options;
  
  return async (req, res, next) => {
    if (req.user?.role !== 'broker') {
      return res.status(403).json({ message: 'Broker access required' });
    }
    
    try {
      const [permissions] = await pool.query(
        'SELECT module, action FROM broker_permissions WHERE role = ?',
        ['broker']
      );
      
      const permissionModules = new Set(permissions.map(p => p.module));
      const permissionActions = new Set(permissions.map(p => p.action));
      
      // If specific modules are required, check they are all present
      if (modules && modules.length > 0) {
        const hasAllModules = modules.every(mod => permissionModules.has(mod));
        if (!hasAllModules) {
          return res.status(403).json({ 
            message: 'Insufficient broker permissions: missing required modules' 
          });
        }
      }
      
      // If specific actions are required, check they are all present
      if (actions && actions.length > 0) {
        const hasAllActions = actions.every(action => permissionActions.has(action));
        if (!hasAllActions) {
          return res.status(403).json({ 
            message: 'Insufficient broker permissions: missing required actions' 
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Error in requireBrokerRole middleware:', error);
      return res.status(500).json({ message: 'Internal server error while checking permissions' });
    }
  };
};

/**
 * Convenience middleware: requireBrokerModuleAction
 * Checks if the broker has permission for a specific module and action combination.
 * 
 * @param {string} module - The module to check (e.g., 'products')
 * @param {string} action - The action to check (e.g., 'create')
 * @returns {Function} Express middleware function
 */
const requireBrokerModuleAction = (module, action) => {
  return async (req, res, next) => {
    if (req.user?.role !== 'broker') {
      return res.status(403).json({ message: 'Broker access required' });
    }
    
    try {
      await checkBrokerPermission(req, res, next, module, action);
    } catch (error) {
      // Already handled inside checkBrokerPermission
    }
  };
};

module.exports = { checkBrokerPermission, requireBrokerRole, requireBrokerModuleAction };
