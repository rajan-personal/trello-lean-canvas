import * as firebase from './firestore'
import * as http from './http-workspace'
import { productionPersistence } from './persistence-types'
const source=()=>productionPersistence()==='postgres'?http:firebase
export const prepareWorkspace:typeof firebase.prepareWorkspace=(...args)=>source().prepareWorkspace(...args)
export const saveWorkspaceDiff:typeof firebase.saveWorkspaceDiff=(...args)=>source().saveWorkspaceDiff(...args)
export const subscribeToWorkspace:typeof firebase.subscribeToWorkspace=(...args)=>source().subscribeToWorkspace(...args)

