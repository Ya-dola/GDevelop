// @flow

import * as React from 'react';
import EventsFunctionsExtensionsContext, {
  type EventsFunctionsExtensionsState,
} from './EventsFunctionsExtensionsContext';
import {
  loadProjectEventsFunctionsExtensions,
  type EventsFunctionCodeWriter,
  unloadProjectEventsFunctionsExtensions,
  unloadProjectEventsFunctionsExtension,
} from '.';
import {
  type EventsFunctionsExtensionWriter,
  type EventsFunctionsExtensionOpener,
} from './Storage';
import { showErrorBox } from '../UI/Messages/MessageBox';
import { t } from '@lingui/macro';
import { type I18n as I18nType } from '@lingui/core';

type Props = {|
  children: React.Node,
  i18n: I18nType,
  eventsFunctionCodeWriter: ?EventsFunctionCodeWriter,
  eventsFunctionsExtensionWriter: ?EventsFunctionsExtensionWriter,
  eventsFunctionsExtensionOpener: ?EventsFunctionsExtensionOpener,
|};

type State = EventsFunctionsExtensionsState;

/**
 * Allow children components to request the loading (or unloading) of
 * the events functions extensions of the project.
 * Useful when dealing with events functions extensions (new extension created,
 * removed, pasted, installed, etc...).
 */
export default class EventsFunctionsExtensionsProvider extends React.Component<
  Props,
  State
> {
  _lastLoadPromise: ?Promise<void> = null;
  state = {
    eventsFunctionsExtensionsError: null,
    loadProjectEventsFunctionsExtensions: this._loadProjectEventsFunctionsExtensions.bind(
      this
    ),
    unloadProjectEventsFunctionsExtensions: this._unloadProjectEventsFunctionsExtensions.bind(
      this
    ),
    unloadProjectEventsFunctionsExtension: this._unloadProjectEventsFunctionsExtension.bind(
      this
    ),
    reloadProjectEventsFunctionsExtensions: this._reloadProjectEventsFunctionsExtensions.bind(
      this
    ),
    ensureLoadFinished: this._ensureLoadFinished.bind(this),
    getEventsFunctionsExtensionWriter: () =>
      this.props.eventsFunctionsExtensionWriter,
    getEventsFunctionsExtensionOpener: () =>
      this.props.eventsFunctionsExtensionOpener,
  };

  _ensureLoadFinished(): Promise<void> {
    if (this._lastLoadPromise) {
      console.info(
        'Waiting on the events functions extensions to finish loading...'
      );
    } else {
      console.info('Events functions extensions are ready.');
    }

    return this._lastLoadPromise
      ? this._lastLoadPromise.then(() => {
          console.info('Events functions extensions finished loading.');
        })
      : Promise.resolve();
  }

  _loadProjectEventsFunctionsExtensions(project: ?gdProject): Promise<void> {
    const { i18n, eventsFunctionCodeWriter } = this.props;
    if (!project || !eventsFunctionCodeWriter) return Promise.resolve();

    const lastLoadPromise = this._lastLoadPromise || Promise.resolve();

    this._lastLoadPromise = lastLoadPromise
      .then(() =>
        loadProjectEventsFunctionsExtensions(
          project,
          eventsFunctionCodeWriter,
          i18n
        )
      )
      .then(() =>
        this.setState({
          eventsFunctionsExtensionsError: null,
        })
      )
      .catch((eventsFunctionsExtensionsError: Error) => {
        this.setState({
          eventsFunctionsExtensionsError,
        });
        showErrorBox(
          i18n._(
            t`An error has occured during functions generation. If GDevelop is installed, verify that nothing is preventing GDevelop from writing on disk. If you're running GDevelop online, verify your internet connection and refresh functions from the Project Manager.`
          ),
          eventsFunctionsExtensionsError
        );
      })
      .then(() => {
        this._lastLoadPromise = null;
      });

    return this._lastLoadPromise;
  }

  _unloadProjectEventsFunctionsExtensions(project: gdProject) {
    unloadProjectEventsFunctionsExtensions(project);
  }

  _unloadProjectEventsFunctionsExtension(
    project: gdProject,
    extensionName: string
  ) {
    unloadProjectEventsFunctionsExtension(project, extensionName);
  }

  _reloadProjectEventsFunctionsExtensions(project: ?gdProject): Promise<void> {
    if (project) {
      this._unloadProjectEventsFunctionsExtensions(project);
    }
    return this._loadProjectEventsFunctionsExtensions(project);
  }

  render() {
    return (
      <EventsFunctionsExtensionsContext.Provider value={this.state}>
        {this.props.children}
      </EventsFunctionsExtensionsContext.Provider>
    );
  }
}
