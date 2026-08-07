module.exports = async function (req, res) {
  var bridgeHandler = require('../smartthings/bridge');

  function parseBody(payload) {
    if (!payload) return {};
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch (error) {
        return {};
      }
    }
    return payload;
  }

  function getSlotValue(slots, names) {
    if (!slots) return '';
    for (var i = 0; i < names.length; i += 1) {
      var key = names[i];
      var slot = slots[key];
      if (slot && slot.value) {
        return String(slot.value).trim();
      }
    }
    return '';
  }

  async function dispatchBridgeCommand(deviceName, actionName) {
    var bridgeReq = {
      method: 'POST',
      body: {
        device: deviceName,
        action: actionName,
        source: 'alexa'
      }
    };

    var bridgeRes = {
      statusCode: 200,
      headers: {},
      body: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      },
      send: function (payload) {
        this.body = payload;
        return this;
      },
      setHeader: function (key, value) {
        this.headers[key] = value;
      }
    };

    await bridgeHandler(bridgeReq, bridgeRes);
    return bridgeRes.body;
  }

  function buildResponse(text, shouldEndSession) {
    return {
      version: '1.0',
      sessionAttributes: {},
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: text
        },
        reprompt: {
          outputSpeech: {
            type: 'PlainText',
            text: 'Ask me to control a device or to show the Ring feed.'
          }
        },
        shouldEndSession: !!shouldEndSession
      }
    };
  }

  var payload = parseBody(req.body);
  var request = payload.request || {};
  var requestType = request.type || 'LaunchRequest';

  if (requestType === 'LaunchRequest') {
    return res.status(200).json(buildResponse('Welcome to your smart home control skill. You can say turn on the living room light, turn off the front door lock, or show the ring feed.', false));
  }

  if (requestType === 'IntentRequest') {
    var intent = request.intent || {};
    var intentName = intent.name || 'HelpIntent';
    var deviceName = getSlotValue(intent.slots || {}, ['device', 'DeviceName', 'deviceName']);
    var actionName = getSlotValue(intent.slots || {}, ['action', 'Action', 'actionName']);

    if (intentName === 'AMAZON.HelpIntent') {
      return res.status(200).json(buildResponse('You can say turn on the living room light, turn off the front door lock, or show the ring feed.', false));
    }

    if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
      return res.status(200).json(buildResponse('Okay, I will stop.', true));
    }

    if (intentName === 'ShowRingFeedIntent') {
      return res.status(200).json(buildResponse('I can open the Ring feed once Ring OAuth is configured. Use the Ring auth endpoint to connect your account.', false));
    }

    if (intentName === 'TurnOnIntent' || intentName === 'TurnOffIntent' || intentName === 'ControlDeviceIntent') {
      var normalizedAction = intentName === 'TurnOnIntent' ? 'on' : intentName === 'TurnOffIntent' ? 'off' : (actionName || 'toggle');
      var normalizedDevice = deviceName || 'default device';
      var bridgeResult = await dispatchBridgeCommand(normalizedDevice, normalizedAction);
      var bridgeMessage = bridgeResult && bridgeResult.message ? bridgeResult.message : 'I received the request.';
      return res.status(200).json(buildResponse('I received a request to ' + normalizedAction + ' ' + normalizedDevice + '. ' + bridgeMessage, false));
    }
  }

  return res.status(200).json(buildResponse('I did not understand that request.', false));
};
