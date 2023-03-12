type OnMessageEventListener = (event: MessageEvent) => void;

const getMockWindow = jest.fn(() => {
  const onEventListeners: Record<string, OnMessageEventListener[]> = {};

  jest
    .spyOn(window, "addEventListener")
    .mockImplementation((event, handler, options) => {
      const currentListeners = onEventListeners[event] || [];
      if ("handleEvent" in handler) {
        currentListeners.push(handler.handleEvent);
      } else {
        currentListeners.push(handler);
      }
      onEventListeners[event] = currentListeners;
    });
  jest
    .spyOn(window, "removeEventListener")
    .mockImplementation((event, handler, options) => {});
  jest.spyOn(window, "postMessage").mockImplementation((message, options) => {
    const event = new MessageEvent("", {
      data: message,
      source: this,
      origin: window.location.href,
    });

    onEventListeners["message"]?.forEach((listener) => {
      listener(event);
    });
  });
});

export const resetMocks = () => {
  getMockWindow();
};

resetMocks();
