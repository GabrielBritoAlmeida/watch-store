import { mount } from '@vue/test-utils'
import ProductCard from '@/components/ProductCard'
import Search from '@/components/Search'
import axios from 'axios'
import { makeServer } from '@/miragejs/server'
import Vue from 'vue'
import ProductList from '.'

jest.mock('axios', () => ({
  get: jest.fn(),
}))

describe('Index - integration', () => {
  let server

  beforeEach(() => {
    server = makeServer({ environment: 'test' })
  })

  afterEach(() => {
    server.shutdown()
  })

  it('should mount the component', () => {
    const wrapper = mount(ProductList)
    expect(wrapper.vm).toBeDefined()
  })

  it('should mount the Search component as a Child', () => {
    const wrapper = mount(ProductList)
    expect(wrapper.findComponent(Search)).toBeDefined()
  })

  it('should call axios.get on component mount', () => {
    mount(ProductList, {
      mocks: {
        $axios: axios,
      },
    })

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith('products')
  })

  it('should mount the ProductCard component 10 times', async () => {
    const products = server.createList('product', 10)

    axios.get.mockReturnValue(Promise.resolve({ data: { products } }))

    const wrapper = mount(ProductList, {
      mocks: {
        $axios: axios,
      },
    })

    await Vue.nextTick()

    const cards = wrapper.findAllComponents(ProductCard)

    expect(cards).toHaveLength(10)
  })

  it('should  display the error message when Promise rejects', async () => {
    axios.get.mockReturnValue(Promise.reject(new Error('')))

    const wrapper = mount(ProductList, {
      mocks: {
        $axios: axios,
      },
    })

    await Vue.nextTick()

    expect(wrapper.text()).toContain('Problemas ao carregar lista produtos.')
  })

  it('should filter the product list when a search is performed', async () => {
    // AAA
    const products = [
      ...server.createList('product', 10),
      server.create('product', {
        title: 'Meu relógio',
      }),
      server.create('product', {
        title: 'Meu outro relógio',
      }),
    ]

    axios.get.mockReturnValue(Promise.resolve({ data: { products } }))

    const wrapper = mount(ProductList, {
      mocks: {
        $axios: axios,
      },
    })

    await Vue.nextTick()

    // ACT
    const search = wrapper.findComponent(Search)
    search.find('input[type="search"]').setValue('relógio')
    await search.find('form').trigger('submit')

    // ASSERT
    const cards = wrapper.findAllComponents(ProductCard)
    expect(wrapper.vm.searchTerm).toEqual('relógio')
    expect(wrapper.text()).toContain('relógio')
    expect(cards).toHaveLength(2)
  })

  it('should filter the product list when a search is cleared', async () => {
    // AAA
    const products = [
      ...server.createList('product', 10),
      server.create('product', {
        title: 'Meu relógio',
      }),
    ]

    axios.get.mockReturnValue(Promise.resolve({ data: { products } }))

    const wrapper = mount(ProductList, {
      mocks: {
        $axios: axios,
      },
    })

    await Vue.nextTick()

    // ACT
    const search = wrapper.findComponent(Search)
    search.find('input[type="search"]').setValue('relógio')
    await search.find('form').trigger('submit')
    search.find('input[type="search"]').setValue('')
    await search.find('form').trigger('submit')

    // ASSERT
    const cards = wrapper.findAllComponents(ProductCard)
    expect(wrapper.vm.searchTerm).toEqual('')
    expect(cards).toHaveLength(11)
  })
})
