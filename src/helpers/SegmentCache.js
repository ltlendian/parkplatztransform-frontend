import { compressToUTF16, decompressFromUTF16 } from 'lz-string'

const LOCAL_STORAGE_KEY = 'data'
const WAIT_TIME_BEFORE_SAVE = 3000

class SegmentCache {

  constructor () {
    this.dataString = null
    this.isSaving = false
    this.lockTimeout = null
  }

  getFromCache () {
    try {
      const compressed = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      this.dataString = decompressFromUTF16(compressed)
      console.log('got data from cache')
      return JSON.parse(this.dataString)
    }
    catch (error) {
      console.log('nothing in cache')
      return {}
    }
  }

  saveToCacheSoon (data) {
    if (!data || Object.keys(data).length === 0) {
      return
    }

    if (!this.isSaving) {
      window.clearTimeout(this.lockTimeout)
      this.lockTimeout = window.setTimeout(() => {
        this.isSaving = true

        try {
          const dataString = this._getDataWithoutDetailsStringified(data)

          // abort if data equals last data
          if (dataString === this.dataString) {
            this.isSaving = false
            return
          }

          const start = Date.now()
          const compressed = compressToUTF16(dataString)
          localStorage.setItem(LOCAL_STORAGE_KEY, compressed)
          this.isSaving = false

          const compressionTime = (Date.now() - start)
          console.log(`compressing and saving data took ${compressionTime / 1000} seconds.`)
        }
        catch (error) {
          console.error('error saving segments to localstorage:', error)
          this.isSaving = false
        }

      }, WAIT_TIME_BEFORE_SAVE)
    }
  }

  // TODO
  _getDataWithoutDetailsStringified (data) {
    const result = {}
    for (const key of Object.keys(data)) {
      const {properties, ...others} = data[key]
      properties.subsegments = []
      result[key] = {
        properties: properties,
        ...others
      }
    }
    return JSON.stringify(result)
  }

}

export default new SegmentCache()