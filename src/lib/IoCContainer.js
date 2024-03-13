/**
 * @file This file defines the IoCContainer class (dependency injection container).
 * @module IoCContainer
 * @author Mats Loock <mats.loock@lnu.se>
 */

// User-land modules.
import httpContext from 'express-http-context'

// Application modules.
import { logger } from '../config/winston.js'
import { Enum } from './Enum.js'

/**
 * Defines the service lifetime.
 *
 * @readonly
 * @enum {string}
 * @property {string} Scoped - The service is created once per scope.
 * @property {string} Singleton - The service is created once.
 * @property {string} Transient - The service is created each time it is requested.
 * @type {object}
 */
const ServiceLifetime = Enum({
  Scoped: 'Scoped',
  Singleton: 'Singleton',
  Transient: 'Transient'
})

/**
 * Regular expression to match JavaScript arrow functions with a single parameter
 * (with or without parentheses) or no parameters (empty parentheses).
 *
 * Components:
 * 1. ^ - Start of the string
 * 2. \s* - Any optional whitespace
 * 3. (\(\s*\)|\(\s*\w+\s*\)|\w+) - Either `()`, a single parameter within parentheses `(param)`, or a single parameter without parentheses `param`
 * 4. \s*=>\s* - Matches the "=>" arrow for the arrow function
 * 5. {?\s*[\s\S]*\s*}? - Matches the function body, either with or without curly braces
 * 6. \s* - Any optional whitespace
 * 7. $ - End of the string
 *
 * It's a simple use case, but it works for the purposes of this application. But there are some limitations:
 *
 * - Does not cover all possible JavaScript syntax variations (e.g., default parameters, rest parameters, TypeScript type annotations)
 * - For more advanced use cases, consider using a JavaScript parsing library, such as Esprima or Acorn
 *
 * @type {RegExp}
 */
const arrowFunctionRegex = /^\s*(\(\s*\)|\(\s*\w+\s*\)|\w+)\s*=>\s*{?\s*[\s\S]*\s*}?\s*$/

/**
 * Encapsulates an inversion of control container.
 */
export class IoCContainer {
  /**
   * A collection of services.
   *
   * @type {Map}
   */
  #services

  /**
   * A collection of single instances.
   *
   * @type {Map}
   */
  #singletons

  /**
   * Initializes a new instance.
   */
  constructor () {
    this.#services = new Map()
    this.#singletons = new Map()
  }

  /**
   * Registers a scoped service with the container.
   *
   * @param {string} name - The service's name.
   * @param {*} definition - The service's definition.
   * @param {string[]} [dependencies=[]] -  An array of dependency names for the service. An empty array by default.
   */
  registerScoped (name, definition, dependencies = []) {
    this.#register(name, definition, {
      dependencies,
      serviceLifetime: ServiceLifetime.Scoped
    })
  }

  /**
   * Registers a singleton service with the container.
   *
   * @param {string} name - The service's name.
   * @param {*} definition - The service's definition.
   * @param {string[]} [dependencies=[]] -  An array of dependency names for the service. An empty array by default.
   */
  registerSingleton (name, definition, dependencies = []) {
    this.#register(name, definition, {
      dependencies,
      serviceLifetime: ServiceLifetime.Singleton
    })
  }

  /**
   * Registers a transient service with the container.
   *
   * @param {string} name - The service's name.
   * @param {*} definition - The service's definition.
   * @param {string[]} [dependencies=[]] -  An array of dependency names for the service. An empty array by default.
   */
  registerTransient (name, definition, dependencies = []) {
    this.#register(name, definition, {
      dependencies,
      serviceLifetime: ServiceLifetime.Transient
    })
  }

  /**
   * Resolves a value or object by name.
   *
   * @param {string} name - The service's name to resolve.
   * @returns {*} A service.
   */
  resolve (name) {
    logger.silly(`Resolving service '${name}'.`)
    const service = this.#services.get(name)

    if (!service) {
      throw new Error(`Service '${name}' not found.`)
    }

    if (service.serviceLifetime === ServiceLifetime.Singleton) {
      return this.#resolveSingletonInstance(service, name)
    }

    if (service.serviceLifetime === ServiceLifetime.Scoped) {
      return this.#resolveScopedInstance(service, name)
    }

    // It's a transient, just create a new instance.
    return this.#createInstance(service)
  }

  /**
   * Registers a service with the container.
   *
   * @param {string} name - The service's name.
   * @param {*} definition - The service's definition.
   * @param {object} options - Configuration options for the service.
   * @param {string[]} [options.dependencies=[]] -  An array of dependency names for the service. An empty array by default.
   * @param {ServiceLifetime} [options.serviceLifetime=undefined] -  The service's lifetime. Undefined by default.
   */
  #register (name, definition, { dependencies = [], serviceLifetime = undefined } = {}) {
    logger.silly(`Register "${name}".`)
    this.#services.set(
      name,
      {
        definition,
        dependencies,
        serviceLifetime,
        isArrowFunction: (
          typeof definition === 'function' &&
          definition.prototype === undefined &&
          arrowFunctionRegex.test(definition.toString())
        )
      })
  }

  /**
   * Resolves a scoped service instance.
   *
   * @private
   * @param {object} service - The service object.
   * @param {string} name - The service's name.
   * @returns {*} A scoped service instance.
   */
  #resolveScopedInstance (service, name) {
    let instance = httpContext.get(`ServiceLifetime.Scoped.${name}`)
    logger.silly(`Scoped instance for service '${name}': ${instance}.`)

    if (!instance) {
      logger.silly(`Creating new scoped instance for service '${name}'.`)
      instance = this.#createInstance(service)
      httpContext.set(`ServiceLifetime.Scoped.${name}`, instance)
    }

    logger.silly(`Returning scoped instance for service '${name}': ${instance}.`)
    return instance
  }

  /**
   * Resolves a singleton service instance.
   *
   * @private
   * @param {object} service - The service object.
   * @param {string} name - The service's name.
   * @returns {*} A singleton service instance.
   */
  #resolveSingletonInstance (service, name) {
    if (!this.#singletons.has(name)) {
      const singletonInstance = this.#createInstance(service)
      this.#singletons.set(name, singletonInstance)
    }

    return this.#singletons.get(name)
  }

  /**
   * Creates a new instance based on a service.
   *
   * @param {object} service - The service object, containing its definition and dependencies.
   * @returns {*} A new instance.
   */
  #createInstance (service) {
    if (service.isArrowFunction) {
      return service.definition(this.resolve.bind(this))
    } else {
      const args = service.dependencies?.map((dependency) => this.resolve(dependency)) || []
      /* eslint-disable-next-line new-cap */
      return new service.definition(...args)
    }
  }
}