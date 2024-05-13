from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS
from nibabel.streamlines import Tractogram
import nibabel as nib
from dipy.io.streamline import load_tractogram
from werkzeug.utils import secure_filename
import os
import io
from scipy.optimize import linear_sum_assignment
from scipy.spatial.distance import directed_hausdorff
import tempfile

app = Flask(__name__)
CORS(app)

#UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'tck', 'nii.gz'}

#app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/py', methods=['POST'])
def index():
    # Receive the JSON data from the client

    fa_file = request.files['nii']
    tck_files = request.files.getlist('tck')
    print(request.files.getlist('tck'))
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as temp_nii:
        fa_file.save(temp_nii.name)
        reference_anatomy = nib.load(temp_nii.name)
    
    streamlines_list = []
    
    for tck_file in tck_files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tck") as temp_tck:
            tck_file.save(temp_tck.name) 
            tractogram = load_tractogram(temp_tck.name, reference_anatomy, bbox_valid_check = False)
        streamlines_list.append([streamline.tolist() for streamline in tractogram.streamlines])
    #tractogram = Tractogram(streamlines=tck_file, affine_to_rasmm=fa_file.affine)
    #streamlines = tractogram.streamlines
    
    #print(tck_file)
    #reference = nib.load(nii)
    #tractogram = load_tractogram(tck, reference)    
    
    # Modify the array, e.g., add 1 to each element
 

    # Return the modified array as JSON
    return jsonify(streamlines_list)

def hausdorff_distance(u, v):
    """
    Compute the Hausdorff distance between two 3D streamlines u and v.
    """
    return max(directed_hausdorff(u, v)[0], directed_hausdorff(v, u)[0])

def compute_centroid(streamline):
    """Compute the centroid of a streamline."""
    return np.mean(streamline, axis=0)

def centroid_distance(u_centroid, v_centroid):
    """Compute the Euclidean distance between two centroids."""
    return np.linalg.norm(u_centroid - v_centroid)

def one_to_one_map_streamlines(bundle1, bundle2):
    """Maps streamlines using centroid-based distances."""
    # Compute centroids for each streamline
    centroids1 = np.array([compute_centroid(s) for s in bundle1])
    centroids2 = np.array([compute_centroid(s) for s in bundle2])
    # Initialize a matrix to hold distances between centroids
    distance_matrix = np.zeros((len(centroids1), len(centroids2)))

    # Populate the distance matrix with Euclidean distances between centroids
    for i, centroid1 in enumerate(centroids1):
        for j, centroid2 in enumerate(centroids2):
            distance_matrix[i, j] = centroid_distance(centroid1, centroid2)
    # Solve the assignment problem
    row_ind, col_ind = linear_sum_assignment(distance_matrix)
    # Create a mapping from indices in bundle1 to indices in bundle2
    return dict(zip(row_ind, col_ind))

def compute_minimum_distances(streamline1, streamline2):
    """
    Compute minimum distances from each point in streamline1 to the closest point in streamline2 and vice versa.
    Returns two arrays: distances from streamline1 to streamline2, and from streamline2 to streamline1.
    """
    # Create a distance matrix from every point in streamline1 to every point in streamline2
    distance_matrix = np.linalg.norm(streamline1[:, np.newaxis] - streamline2, axis=2)

    # Find the minimum distance for each point in streamline1 to streamline2
    distances1_2 = np.min(distance_matrix, axis=1)

    # Find the minimum distance for each point in streamline2 to streamline1
    distances2_1 = np.min(distance_matrix, axis=0)

    return distances1_2, distances2_1

def segment_distances_for_mapping(bundle1, bundle2, mapping):
    """
    Computes minimum segment distances for all matched streamline pairs according to the provided mapping.
    Returns two lists of arrays: one for distances from bundle1 to bundle2 and one for distances from bundle2 to bundle1.
    """
    distances1_2 = []
    distances2_1 = []
    for i, j in mapping.items():
        min_distances_1_to_2, min_distances_2_to_1 = compute_minimum_distances(bundle1[i], bundle2[j])
        distances1_2.append(min_distances_1_to_2)
        distances2_1.append(min_distances_2_to_1)
    return distances1_2, distances2_1

@app.route('/color_distance', methods=['POST'])
def color_distance():
    data = request.get_json()
    streamlines1 = np.array(data['array1'])
    streamlines2 = np.array(data['array2'])
    mapping = one_to_one_map_streamlines(streamlines1, streamlines2)
    distances1, distances2 = segment_distances_for_mapping(streamlines1, streamlines2, mapping)
    mapping_list = [(int(key), int(value)) for key, value in mapping.items()]
    distances_list1 = [distance.tolist() for distance in distances1]
    distances_list2 = [distance.tolist() for distance in distances2]

    return jsonify({'mapping': mapping_list, 'distances':[distances_list1, distances_list2]})