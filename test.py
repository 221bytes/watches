from __future__ import absolute_import, division, print_function

import matplotlib.pylab as plt

import tensorflow as tf
import tensorflow_hub as hub

from tensorflow.keras import layers

## config for using the gpu memory with keras
from keras.backend.tensorflow_backend import set_session
import tensorflow as tf

config = tf.ConfigProto()
config.gpu_options.allow_growth = True  # dynamically grow the memory used on the GPU
config.log_device_placement = True  # to log device placement (on which device the operation ran)
sess = tf.Session(config=config)
set_session(sess)  # set this TensorFlow session as the default session for Keras

feature_extractor_url = "https://tfhub.dev/google/imagenet/inception_resnet_v2/feature_vector/1"

# data_root  = "./images/raw_images"
data_root  = "./images/processed_images"

def feature_extractor(x):
  feature_extractor_module = hub.Module(feature_extractor_url)
  return feature_extractor_module(x)

IMAGE_SIZE = hub.get_expected_image_size(hub.Module(feature_extractor_url))

print (IMAGE_SIZE)

image_generator = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1/255)

image_data = image_generator.flow_from_directory(str(data_root), target_size=IMAGE_SIZE)
# for image_batch,label_batch in image_data:
#   print("Image batch shape: ", image_batch.shape)
#   print("Label batch shape: ", label_batch.shape)
#   break

features_extractor_layer = layers.Lambda(feature_extractor, input_shape=IMAGE_SIZE+[3])

features_extractor_layer.trainable = False

# model = tf.keras.Sequential([
#   features_extractor_layer,
#   layers.Dense(253, activation='softmax')
# ])
# model.summary()

# Save the tf.keras model in the SavedModel format.
# model = tf.contrib.saved_model.load_keras_model( '/home/alex/Project/watches/saved_models/1553887434')
# model = tf.contrib.saved_model.load_keras_model( '/home/alex/Project/watches/saved_models/1553894734')
# model = tf.contrib.saved_model.load_keras_model( '/home/alex/Project/watches/saved_models/1553897560')
# model = tf.contrib.saved_model.load_keras_model('keras_model.hdf5')

import tensorflow.keras as keras
import tensorflow.keras.backend as K

model = keras.models.load_model('keras_model.hdf5')

saver = tf.train.Saver()
sess = K.get_session()
saver.restore(sess, './keras_model')
# init = tf.global_variables_initializer()

# sess.run(init)

import numpy as np
import PIL.Image as Image

# grace_hopper = tf.keras.utils.get_file('105-89-00_m80298-0066.jpg','https://www.watchadvisor.com/sites/default/files/styles/watchcard/public/watch/images_imported/105-89-00_m80298-0066.jpg?itok=NH_Jr-Cl')
# grace_hopper = Image.open(grace_hopper).resize(IMAGE_SIZE)
grace_hopper = Image.open("/home/alex/Project/watches/images/raw_images/tag-heuer/110080-1.jpg").resize(IMAGE_SIZE)
grace_hopper

grace_hopper = np.array(grace_hopper)/255.0
grace_hopper.shape

result = model.predict(grace_hopper[np.newaxis, ...])
result.shape

predicted_class = np.argmax(result[0], axis=-1)
predicted_class

label_names = sorted(image_data.class_indices.items(), key=lambda pair:pair[1])
label_names = np.array([key.title() for key, value in label_names])

plt.imshow(grace_hopper)
plt.axis('off')
predicted_class_name = label_names[predicted_class]
_ = plt.title("Prediction: " + predicted_class_name)

plt.show()

print(predicted_class_name,predicted_class, label_names, result)