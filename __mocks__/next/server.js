// Mock pour next/server

class Headers {
  constructor(init) {
    this._headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase());
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase());
  }
  
  delete(name) {
    this._headers.delete(name.toLowerCase());
  }
  
  entries() {
    return this._headers.entries();
  }
}

// Si global.Headers n'existe pas, nous le définissons
if (typeof global.Headers === 'undefined') {
  global.Headers = Headers;
}

// Si global.Response n'existe pas, nous le définissons
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Headers(init?.headers);
      this._body = body;
    }

    json() {
      return Promise.resolve(
        typeof this._body === 'string' ? JSON.parse(this._body) : this._body
      );
    }
    
    text() {
      return Promise.resolve(String(this._body));
    }
  };
}

// Si global.Request n'existe pas, nous le définissons
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
    }
  };
}

class NextRequest extends global.Request {
  constructor(input, init) {
    super(input, init);
    try {
      this.nextUrl = new URL(typeof input === 'string' ? input : input.url);
    } catch (e) {
      this.nextUrl = {
        pathname: '/mock-path',
        search: '',
        searchParams: new URLSearchParams()
      };
    }
    this.cookies = {
      get: jest.fn().mockReturnValue({ value: 'mock-cookie-value' }),
      getAll: jest.fn().mockReturnValue([{ value: 'mock-cookie-value' }]),
      set: jest.fn(),
      delete: jest.fn(),
    };
  }

  json() {
    return Promise.resolve({ mocked: true });
  }
}

const NextResponse = {
  json: jest.fn((body, init) => {
    return new global.Response(JSON.stringify(body), {
      ...init,
      headers: { 
        ...init?.headers,
        'Content-Type': 'application/json'
      }
    });
  }),
  redirect: jest.fn((url) => {
    const response = new global.Response(null, { status: 302 });
    response.headers.set('Location', url);
    return response;
  }),
  rewrite: jest.fn((url) => {
    const response = new global.Response(null, { status: 200 });
    response.headers.set('x-middleware-rewrite', url);
    return response;
  }),
  next: jest.fn(() => {
    return new global.Response(null, { status: 200 });
  }),
};

const userAgent = jest.fn(() => ({
  isBot: false,
  browser: { name: 'mock-browser', version: '1.0.0' },
  device: { model: 'mock-device', type: 'desktop', vendor: 'mock-vendor' },
  engine: { name: 'mock-engine', version: '1.0.0' },
  os: { name: 'mock-os', version: '1.0.0' },
  cpu: { architecture: 'mock-architecture' },
}));

const cookies = jest.fn(() => ({
  get: jest.fn().mockReturnValue({ value: 'mock-cookie-value' }),
  getAll: jest.fn().mockReturnValue([{ value: 'mock-cookie-value' }]),
  set: jest.fn(),
  delete: jest.fn(),
}));

// Exporter les classes et fonctions
module.exports = {
  NextRequest,
  NextResponse,
  userAgent,
  cookies,
  Response: global.Response,
  Headers: global.Headers,
  Request: global.Request
}; 