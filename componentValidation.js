import {ComponentTypes, CUSSDataTypes, DeviceTypes, MediaTypes} from "cuss2-typescript-models";
import {expect} from 'chai'

export const validateComponent = (component) => {
  expect(component).to.exist
  expect(component).to.have.nested.property('componentCharacteristics[0].mediaTypesList')
  //TODO: this isn't quite correct- fix later
  const type = component.componentCharacteristics[0].mediaTypesList[0]
  const validator = validate[type]
  if (validator) {
    validate[type](component)
  }
  //TODO: add more component validators
}


export const validate = {
  [MediaTypes.BARCODE]: (component) => {
    expect(component).to.have.nested.property('componentDescription')
    expect(component).to.have.property('componentType', ComponentTypes.MEDIA_INPUT)
    expect(component).to.have.property('componentCharacteristics').with.length(1)
    const characteristics = component.componentCharacteristics[0]
    expect(characteristics).to.have.nested.property('mediaTypesList[0]', MediaTypes.BARCODE)
    expect(characteristics).to.have.property('deviceTypesList').with.length(1)
  }
}
