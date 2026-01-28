#%%
import plotly.graph_objects as go
import numpy as np

#%%

xy = np.linspace(-5, 5, 15)
xx, yy = np.meshgrid(xy, xy)
xxyy = np.append(xx[:,:,np.newaxis], yy[:,:,np.newaxis], axis=-1)
mu = np.array([0,0])
sigma = np.array([
    [1,0.3],
    [0.1,1],
])
quad = np.einsum("bni,ij,bnj->bn",xxyy-mu,np.linalg.inv(sigma),xxyy-mu)
zz = np.exp(-quad) + 1.5e-2*np.random.randn(*quad.shape)
zz /= zz.sum()

fig = go.Figure(layout=dict(
    width=300, height=300,
    xaxis_visible=False,
    yaxis_visible=False,
    margin=dict(t=0, b=0, l=0, r=0),
))
fig.add_traces(dict(
    z=zz,
    type="heatmap",
    colorscale=[
        [0.0, "#000000"],
        [0.4, "#c80000"],
        [1.0, "#ffcccc"],
    ],
    showscale=False,
))
fig.show()
fig.write_image("thumbnail.png")
# %%
