const regexes = {
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
  email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  url: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
  ein: /^\d{2}\-?\d{7}$/,
  routing: /^\d{9}$/,
}

export const test = (type, val) => {
  const regex = new RegExp(regexes[type])
  return regex.test(val)
}

export default {
  install: function (Vue) {
    Vue.prototype.$regex = {
      is: function (val) {
        return {
          a: function (regexType) {
            return test(regexType, val)
          },
        }
      },
    }
  },
}