import { Connections } from '../connections/Connections'

export interface ConnectionCreator {
  create(options: object): Promise<Connections>
}
