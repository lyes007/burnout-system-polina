"""
Save the preprocessor (OneHotEncoder and StandardScaler) from the notebook
This should be run after training the model in the notebook
"""

import pickle
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

# This script should be run in the notebook context after training
# It saves the preprocessor for use in the Next.js app

def save_preprocessor(X_train, categorical_features, numerical_features):
    """
    Save the preprocessor used in training
    
    Args:
        X_train: Training features DataFrame (before encoding)
        categorical_features: List of categorical feature names
        numerical_features: List of numerical feature names
    """
    
    # Create the same preprocessor as in the notebook
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_features),
            ('num', StandardScaler(), numerical_features)
        ],
        remainder='passthrough'
    )
    
    # Fit on training data
    preprocessor.fit(X_train)
    
    # Save preprocessor
    with open('preprocessor.pkl', 'wb') as f:
        pickle.dump(preprocessor, f)
    
    # Save feature names for reference
    feature_names = preprocessor.get_feature_names_out()
    with open('feature_names.txt', 'w') as f:
        for name in feature_names:
            f.write(f"{name}\n")
    
    print(f"Preprocessor saved!")
    print(f"Total features after encoding: {len(feature_names)}")
    print(f"Feature names saved to feature_names.txt")
    
    return preprocessor

# Example usage in notebook:
# After cell 32 (after creating X_train_encoded), run:
# preprocessor = save_preprocessor(
#     X_train,  # Before encoding
#     categorical_features,
#     numerical_features
# )




